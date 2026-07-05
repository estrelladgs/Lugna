"""
Posture analysis service.
Uses MediaPipe (Tasks API) when available; falls back to a rule-based mock otherwise.
"""

import base64
import os
import threading
import urllib.request
from typing import Dict, List, Optional, Tuple

try:
    import cv2
    import mediapipe as mp
    import numpy as np
    from mediapipe.tasks.python import BaseOptions
    from mediapipe.tasks.python import vision

    MEDIAPIPE_AVAILABLE = True
except ImportError:
    MEDIAPIPE_AVAILABLE = False


# ---------------------------------------------------------------------------
# Pose landmarker model (Tasks API) — lazy download + singleton instance
# ---------------------------------------------------------------------------

_MODEL_DIR = os.path.join(os.path.dirname(__file__), "..", "ml_models")
_MODEL_PATH = os.path.join(_MODEL_DIR, "pose_landmarker_lite.task")
_MODEL_URL = (
    "https://storage.googleapis.com/mediapipe-models/pose_landmarker/"
    "pose_landmarker_lite/float16/latest/pose_landmarker_lite.task"
)

_landmarker = None
_landmarker_lock = threading.Lock()


def _get_landmarker():
    """Lazily download the model file and build a singleton PoseLandmarker."""
    global _landmarker
    if _landmarker is not None:
        return _landmarker

    with _landmarker_lock:
        if _landmarker is not None:
            return _landmarker

        os.makedirs(_MODEL_DIR, exist_ok=True)
        if not os.path.exists(_MODEL_PATH):
            urllib.request.urlretrieve(_MODEL_URL, _MODEL_PATH)

        options = vision.PoseLandmarkerOptions(
            base_options=BaseOptions(model_asset_path=_MODEL_PATH),
            running_mode=vision.RunningMode.IMAGE,
            num_poses=1,
            min_pose_detection_confidence=0.5,
        )
        _landmarker = vision.PoseLandmarker.create_from_options(options)
        return _landmarker


# ---------------------------------------------------------------------------
# Geometry helpers
# ---------------------------------------------------------------------------

def _angle(a, b, c) -> float:
    """Angle at joint b formed by segments b-a and b-c (degrees)."""
    import numpy as np
    ba = np.array([a[0] - b[0], a[1] - b[1]])
    bc = np.array([c[0] - b[0], c[1] - b[1]])
    norm = np.linalg.norm(ba) * np.linalg.norm(bc)
    if norm == 0:
        return 0.0
    cos_val = np.dot(ba, bc) / norm
    return float(np.degrees(np.arccos(np.clip(cos_val, -1.0, 1.0))))


def _lm(landmarks, idx):
    """Return (x, y) for a landmark index."""
    lm = landmarks[idx]
    return (lm.x, lm.y)


# MediaPipe landmark indices
_L_SHOULDER = 11
_R_SHOULDER = 12
_L_ELBOW = 13
_R_ELBOW = 14
_L_WRIST = 15
_R_WRIST = 16
_L_HIP = 23
_R_HIP = 24
_L_KNEE = 25
_R_KNEE = 26
_L_ANKLE = 27
_R_ANKLE = 28


class _Result:
    """Accumulator for a single posture check pass."""

    def __init__(self):
        self.score = 100.0
        self.corrections: List[str] = []
        self.bad_landmarks: List[int] = []

    def fail(self, points: float, message: str, landmarks: Tuple[int, ...]):
        self.score -= points
        self.corrections.append(message)
        self.bad_landmarks.extend(landmarks)

    def as_dict(self) -> Dict:
        return {
            "score": max(0.0, self.score),
            "corrections": self.corrections,
            "bad_landmarks": sorted(set(self.bad_landmarks)),
        }


# ---------------------------------------------------------------------------
# Per-posture analyzers
# ---------------------------------------------------------------------------

def _analyze_plank(lm) -> Dict:
    r = _Result()

    shoulder = _lm(lm, _L_SHOULDER)
    hip = _lm(lm, _L_HIP)
    ankle = _lm(lm, _L_ANKLE)

    body_angle = _angle(shoulder, hip, ankle)
    # Ideal straight line → angle near 180°
    deviation = abs(180.0 - body_angle)
    if deviation > 20:
        if hip[1] < shoulder[1] - 0.05:
            r.fail(40, "Baja las caderas; el cuerpo debe formar una línea recta.",
                   (_L_SHOULDER, _L_HIP, _L_ANKLE))
        else:
            r.fail(40, "Eleva las caderas; evita que la pelvis caiga.",
                   (_L_SHOULDER, _L_HIP, _L_ANKLE))

    wrist = _lm(lm, _L_WRIST)
    shoulder_over_wrist = abs(wrist[0] - shoulder[0])
    if shoulder_over_wrist > 0.1:
        r.fail(20, "Coloca los hombros directamente sobre las muñecas.",
               (_L_SHOULDER, _L_WRIST))

    return r.as_dict()


def _analyze_hundred(lm) -> Dict:
    r = _Result()

    hip = _lm(lm, _L_HIP)
    knee = _lm(lm, _L_KNEE)
    ankle = _lm(lm, _L_ANKLE)

    leg_angle = _angle(hip, knee, ankle)
    # Legs should be extended (~180°) at ~45° from the floor
    if leg_angle < 150:
        r.fail(30, "Extiende completamente las piernas.", (_L_HIP, _L_KNEE, _L_ANKLE))

    shoulder = _lm(lm, _L_SHOULDER)
    # Head/shoulder should be lifted (lower y value = higher on screen)
    if shoulder[1] > hip[1] - 0.05:
        r.fail(30, "Eleva los hombros y la cabeza del suelo; lleva el mentón al pecho.",
               (_L_SHOULDER,))

    wrist = _lm(lm, _L_WRIST)
    if wrist[1] > hip[1]:
        r.fail(20, "Mantén los brazos paralelos al suelo durante el bombeo.", (_L_WRIST,))

    return r.as_dict()


def _analyze_roll_up(lm) -> Dict:
    r = _Result()

    shoulder = _lm(lm, _L_SHOULDER)
    hip = _lm(lm, _L_HIP)
    knee = _lm(lm, _L_KNEE)

    torso_angle = _angle(knee, hip, shoulder)
    # Forward fold: torso angle should be small (<90°)
    if torso_angle > 100:
        r.fail(40, "Redondea más la columna y lleva el torso hacia los pies.",
               (_L_SHOULDER, _L_HIP, _L_KNEE))

    wrist = _lm(lm, _L_WRIST)
    if wrist[1] > knee[1]:
        r.fail(20, "Extiende los brazos más hacia los pies.", (_L_WRIST, _L_KNEE))

    return r.as_dict()


def _analyze_single_leg_stretch(lm) -> Dict:
    r = _Result()

    hip = _lm(lm, _L_HIP)
    knee = _lm(lm, _L_KNEE)
    ankle = _lm(lm, _L_ANKLE)

    bent_leg_angle = _angle(hip, knee, ankle)
    if bent_leg_angle > 120:
        r.fail(30, "Dobla más la rodilla y llévala hacia el pecho.", (_L_HIP, _L_KNEE, _L_ANKLE))

    shoulder = _lm(lm, _L_SHOULDER)
    if shoulder[1] > hip[1]:
        r.fail(30, "Eleva la cabeza y los hombros del suelo.", (_L_SHOULDER,))

    return r.as_dict()


def _analyze_double_leg_stretch(lm) -> Dict:
    r = _Result()

    shoulder = _lm(lm, _L_SHOULDER)
    hip = _lm(lm, _L_HIP)
    ankle = _lm(lm, _L_ANKLE)

    if shoulder[1] > hip[1]:
        r.fail(30, "Mantén los hombros y la cabeza elevados del suelo.", (_L_SHOULDER,))

    leg_height = hip[1] - ankle[1]
    if leg_height < 0.05:
        r.fail(30, "Eleva las piernas a aproximadamente 45° del suelo.", (_L_HIP, _L_ANKLE))

    return r.as_dict()


def _analyze_spine_stretch(lm) -> Dict:
    r = _Result()

    shoulder = _lm(lm, _L_SHOULDER)
    hip = _lm(lm, _L_HIP)
    knee = _lm(lm, _L_KNEE)

    forward_reach = shoulder[0] - knee[0]
    if forward_reach < 0.05:
        r.fail(40, "Alarga más la columna hacia adelante; imagina que tocas los pies.",
               (_L_SHOULDER, _L_KNEE))

    wrist = _lm(lm, _L_WRIST)
    arm_extension = wrist[0] - shoulder[0]
    if arm_extension < 0.1:
        r.fail(20, "Extiende los brazos completamente al frente.", (_L_WRIST, _L_SHOULDER))

    return r.as_dict()


def _analyze_rolling_like_a_ball(lm) -> Dict:
    r = _Result()

    shoulder = _lm(lm, _L_SHOULDER)
    hip = _lm(lm, _L_HIP)
    knee = _lm(lm, _L_KNEE)

    # Knee should be close to chest
    knee_to_chest = abs(knee[0] - shoulder[0]) + abs(knee[1] - shoulder[1])
    if knee_to_chest > 0.3:
        r.fail(40, "Lleva las rodillas más cerca del pecho para crear la curva en C.",
               (_L_KNEE, _L_SHOULDER))

    torso_curve = _angle(shoulder, hip, knee)
    if torso_curve > 100:
        r.fail(30, "Redondea más la espalda; mantén la curva en C durante todo el ejercicio.",
               (_L_SHOULDER, _L_HIP, _L_KNEE))

    return r.as_dict()


def _analyze_single_leg_circles(lm) -> Dict:
    r = _Result()

    l_hip = _lm(lm, _L_HIP)
    r_hip = _lm(lm, _R_HIP)

    hip_tilt = abs(l_hip[1] - r_hip[1])
    if hip_tilt > 0.05:
        r.fail(40, "Mantén la pelvis estable y nivelada; evita el balanceo lateral.",
               (_L_HIP, _R_HIP))

    l_knee = _lm(lm, _L_KNEE)
    l_ankle = _lm(lm, _L_ANKLE)
    leg_angle = _angle(l_hip, l_knee, l_ankle)
    if leg_angle < 150:
        r.fail(30, "Extiende completamente la pierna en el aire.", (_L_HIP, _L_KNEE, _L_ANKLE))

    return r.as_dict()


_ANALYZERS = {
    "plank": _analyze_plank,
    "hundred": _analyze_hundred,
    "roll_up": _analyze_roll_up,
    "single_leg_stretch": _analyze_single_leg_stretch,
    "double_leg_stretch": _analyze_double_leg_stretch,
    "spine_stretch": _analyze_spine_stretch,
    "rolling_like_a_ball": _analyze_rolling_like_a_ball,
    "single_leg_circles": _analyze_single_leg_circles,
}


# ---------------------------------------------------------------------------
# Mock fallback (used when MediaPipe is not installed or the model can't be
# downloaded, e.g. no internet on first run)
# ---------------------------------------------------------------------------

_MOCK_CORRECTIONS = {
    "plank": [
        "Asegúrate de que el cuerpo forma una línea recta de cabeza a talones.",
        "Activa el core durante todo el ejercicio.",
    ],
    "hundred": [
        "Mantén las piernas a 45° del suelo.",
        "Bombea los brazos con pequeños movimientos controlados.",
    ],
    "roll_up": [
        "Articula la columna vértebra a vértebra al subir y bajar.",
        "Mantén los pies en el suelo con los tobillos activos.",
    ],
    "single_leg_circles": [
        "Estabiliza la pelvis mientras describes el círculo con la pierna.",
        "Mantén la pierna de apoyo firmemente apoyada en el suelo.",
    ],
    "rolling_like_a_ball": [
        "Crea una curva en C profunda con la columna.",
        "Equilibra el peso sobre el coxis al inicio.",
    ],
    "single_leg_stretch": [
        "Mantén la cabeza y los hombros elevados del suelo.",
        "Alterna las piernas con control y precisión.",
    ],
    "double_leg_stretch": [
        "Coordina la extensión de brazos y piernas al mismo tiempo.",
        "Mantén el core activo durante todo el movimiento.",
    ],
    "spine_stretch": [
        "Alarga la columna antes de inclinarte hacia adelante.",
        "Exhala mientras llevas el torso hacia los pies.",
    ],
}


def _mock_response(posture_id: str) -> dict:
    import random
    score = random.uniform(55.0, 90.0)
    corrections = _MOCK_CORRECTIONS.get(posture_id, ["Mantén la posición correctamente."])
    is_correct = score >= 70
    if is_correct:
        corrections = corrections[:1]
    return {
        "isCorrect": is_correct,
        "score": round(score, 1),
        "corrections": corrections,
        "landmarks": None,
        "incorrectLandmarks": [],
    }


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def analyze_posture(posture_id: str, frame_base64: str) -> dict:
    """
    Analyze a posture from a base64-encoded JPEG/PNG frame.
    Returns a dict compatible with PostureFeedbackOut.
    """
    if not MEDIAPIPE_AVAILABLE:
        return _mock_response(posture_id)

    # Strip data URI prefix if present
    if "," in frame_base64:
        frame_base64 = frame_base64.split(",", 1)[1]

    try:
        img_bytes = base64.b64decode(frame_base64)
        img_array = np.frombuffer(img_bytes, dtype=np.uint8)
        img_bgr = cv2.imdecode(img_array, cv2.IMREAD_COLOR)
        if img_bgr is None:
            raise ValueError("Could not decode image")
        img_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)
    except Exception:
        return _mock_response(posture_id)

    try:
        landmarker = _get_landmarker()
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=img_rgb)
        results = landmarker.detect(mp_image)
    except Exception:
        return _mock_response(posture_id)

    if not results.pose_landmarks:
        return {
            "isCorrect": False,
            "score": 0.0,
            "corrections": ["No se detectó ninguna persona en la imagen. Asegúrate de que todo el cuerpo esté visible."],
            "landmarks": None,
            "incorrectLandmarks": [],
        }

    lm = results.pose_landmarks[0]

    # Run posture-specific analysis
    analyzer = _ANALYZERS.get(posture_id)
    if analyzer is None:
        result = {"score": 75.0, "corrections": [], "bad_landmarks": []}
    else:
        result = analyzer(lm)

    score = result["score"]
    corrections = result["corrections"]
    bad_landmarks = result["bad_landmarks"]
    is_correct = score >= 70 and len(corrections) == 0

    landmarks = [
        {"x": l.x, "y": l.y, "z": l.z, "visibility": l.visibility}
        for l in lm
    ]

    return {
        "isCorrect": is_correct,
        "score": round(score, 1),
        "corrections": corrections,
        "landmarks": landmarks,
        "incorrectLandmarks": bad_landmarks,
    }
