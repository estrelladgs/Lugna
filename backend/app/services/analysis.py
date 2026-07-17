"""
Posture analysis service.
Uses MediaPipe (Tasks API) when available; falls back to a rule-based mock otherwise.
"""

import base64
import math
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
    knee = _lm(lm, _L_KNEE)
    elbow = _lm(lm, _L_ELBOW)

    body_angle = _angle(shoulder, hip, ankle)
    # Ideal straight line → angle near 180°
    deviation = abs(180.0 - body_angle)
    if deviation > 20:
        if hip[1] < shoulder[1] - 0.05:
            r.fail(25, "Baja las caderas; el cuerpo debe formar una línea recta.",
                   (_L_SHOULDER, _L_HIP, _L_ANKLE))
        else:
            r.fail(25, "Eleva las caderas; evita que la pelvis caiga.",
                   (_L_SHOULDER, _L_HIP, _L_ANKLE))

    # Both legs must be extended — rules out a side-lying pose with one knee bent,
    # which still produces a "straight" shoulder-hip-ankle line on the tracked side.
    r_knee = _lm(lm, _R_KNEE)
    r_ankle = _lm(lm, _R_ANKLE)
    r_hip = _lm(lm, _R_HIP)
    l_leg_angle = _angle(hip, knee, ankle)
    right_leg_angle = _angle(r_hip, r_knee, r_ankle)
    if l_leg_angle < 150 or right_leg_angle < 150:
        r.fail(20, "Extiende ambas piernas por completo; ninguna rodilla debe estar doblada.",
               (_L_KNEE, _R_KNEE))

    # The arm must be actively bent DOWN to bear weight (elbow roughly perpendicular
    # to the torso), not trailing alongside the body (arms at rest, ~0°) nor reaching
    # backward overhead (lying on the back, ~180°). This is what actually separates a
    # real plank from "just lying down" in any arm position.
    support_angle = _angle(hip, shoulder, elbow)
    if support_angle < 45 or support_angle > 135:
        r.fail(30, "Apoya el peso sobre el antebrazo o la mano, con el codo doblado bajo el hombro; no dejes el brazo pegado al cuerpo ni estirado hacia atrás.",
               (_L_SHOULDER, _L_ELBOW))

    wrist = _lm(lm, _L_WRIST)
    shoulder_over_wrist = abs(wrist[0] - shoulder[0])
    if shoulder_over_wrist > 0.15:
        r.fail(15, "Coloca los hombros directamente sobre las muñecas.",
               (_L_SHOULDER, _L_WRIST))

    return r.as_dict()


def _analyze_hundred(lm) -> Dict:
    r = _Result()

    hip = _lm(lm, _L_HIP)
    knee = _lm(lm, _L_KNEE)
    ankle = _lm(lm, _L_ANKLE)

    leg_angle = _angle(hip, knee, ankle)
    # Las piernas deben estar extendidas (~180°) a ~45° del suelo
    if leg_angle < 150:
        r.fail(30, "Extiende completamente las piernas.", (_L_HIP, _L_KNEE, _L_ANKLE))

    leg_lift = hip[1] - ankle[1]
    if leg_lift < 0.12:
        r.fail(30, "Eleva las piernas del suelo; ahora mismo están apoyadas.", (_L_HIP, _L_ANKLE))

    shoulder = _lm(lm, _L_SHOULDER)
    # La cabeza y los hombros deben estar elevados del suelo, con el mentón hacia el pecho
    if shoulder[1] > hip[1] - 0.05:
        r.fail(30, "Eleva los hombros y la cabeza del suelo; lleva el mentón al pecho.",
                (_L_SHOULDER,))

    wrist = _lm(lm, _L_WRIST)
    if wrist[1] > hip[1]:
        r.fail(20, "Mantén los brazos paralelos al suelo durante el bombeo.", (_L_WRIST,))

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
    shoulder_lift = hip[1] - shoulder[1]
    if shoulder_lift < 0.03:
        r.fail(30, "Eleva la cabeza y los hombros del suelo.", (_L_SHOULDER,))

    return r.as_dict()


def _analyze_double_leg_stretch(lm) -> Dict:
    r = _Result()

    shoulder = _lm(lm, _L_SHOULDER)
    hip = _lm(lm, _L_HIP)
    ankle = _lm(lm, _L_ANKLE)

    shoulder_lift = hip[1] - shoulder[1]
    if shoulder_lift < 0.03:
        r.fail(30, "Mantén los hombros y la cabeza elevados del suelo.", (_L_SHOULDER,))

    leg_height = hip[1] - ankle[1]
    if leg_height < 0.05:
        r.fail(30, "Eleva las piernas a aproximadamente 45° del suelo.", (_L_HIP, _L_ANKLE))

    return r.as_dict()


def _analyze_spine_stretch(lm) -> Dict:
    r = _Result()

    shoulder = _lm(lm, _L_SHOULDER)
    knee = _lm(lm, _L_KNEE)
    ankle = _lm(lm, _L_ANKLE)
    wrist = _lm(lm, _L_WRIST)

    forward_reach = shoulder[0] - knee[0]
    if forward_reach < 0.05:
        r.fail(40, "Alarga más la columna hacia adelante; imagina que tocas los pies.",
               (_L_SHOULDER, _L_KNEE))

    # Measure the hand's distance to the foot directly, instead of relative to the
    # shoulder — in a deep fold the shoulder itself moves well past the hip, which
    # made the old shoulder-relative check fail even when the hands were on the feet.
    hand_to_foot_gap = abs(wrist[0] - ankle[0]) + abs(wrist[1] - ankle[1])
    if hand_to_foot_gap > 0.2:
        r.fail(20, "Extiende los brazos hasta alcanzar los pies.", (_L_WRIST, _L_ANKLE))

    return r.as_dict()


def _analyze_rolling_like_a_ball(lm) -> Dict:
    r = _Result()

    shoulder = _lm(lm, _L_SHOULDER)
    hip = _lm(lm, _L_HIP)
    knee = _lm(lm, _L_KNEE)
    ankle = _lm(lm, _L_ANKLE)

    # Feet must be off the ground, balanced on the tailbone — otherwise this is just
    # sitting hugging the knees, which can otherwise satisfy the checks below too.
    feet_lift = hip[1] - ankle[1]
    if feet_lift < -0.05:
        r.fail(30, "Levanta los pies del suelo; mantén el equilibrio sobre el coxis.",
               (_L_HIP, _L_ANKLE))

    # Knee should be close to chest
    knee_to_chest = abs(knee[0] - shoulder[0]) + abs(knee[1] - shoulder[1])
    if knee_to_chest > 0.3:
        r.fail(35, "Lleva las rodillas más cerca del pecho para crear la curva en C.",
               (_L_KNEE, _L_SHOULDER))

    torso_curve = _angle(shoulder, hip, knee)
    if torso_curve > 100:
        r.fail(35, "Redondea más la espalda; mantén la curva en C durante todo el ejercicio.",
               (_L_SHOULDER, _L_HIP, _L_KNEE))

    return r.as_dict()


def _analyze_single_leg_circles(lm) -> Dict:
    r = _Result()

    l_hip = _lm(lm, _L_HIP)
    r_hip = _lm(lm, _R_HIP)
    l_knee = _lm(lm, _L_KNEE)
    l_ankle = _lm(lm, _L_ANKLE)
    r_knee = _lm(lm, _R_KNEE)
    r_ankle = _lm(lm, _R_ANKLE)

    # Either leg can be the one circling in the air — checking only one side meant
    # this only worked when the user happened to raise that specific leg.
    l_lift = l_hip[1] - l_ankle[1]
    r_lift = r_hip[1] - r_ankle[1]
    working_hip, working_knee, working_ankle = (
        (l_hip, l_knee, l_ankle) if l_lift >= r_lift else (r_hip, r_knee, r_ankle)
    )
    lift = max(l_lift, r_lift)

    if lift < 0.12:
        r.fail(40, "Eleva una pierna en el aire; ahora mismo las dos están apoyadas en el suelo.",
               (_L_HIP, _L_ANKLE, _R_HIP, _R_ANKLE))

    hip_tilt = abs(l_hip[1] - r_hip[1])
    if hip_tilt > 0.05:
        r.fail(30, "Mantén la pelvis estable y nivelada; evita el balanceo lateral.",
               (_L_HIP, _R_HIP))

    leg_angle = _angle(working_hip, working_knee, working_ankle)
    if leg_angle < 150:
        r.fail(30, "Extiende completamente la pierna en el aire.",
               (_L_HIP, _L_KNEE, _L_ANKLE, _R_HIP, _R_KNEE, _R_ANKLE))

    return r.as_dict()


_STANDING_HIP_ANKLE_GAP = 0.28
_SUPINE_MAX_INCLINE_DEGREES = 45.0

# Exercises performed lying on the back — the shoulder-hip line must stay close to
# horizontal; a torso propped up near-vertical means the user is sitting, not lying.
_SUPINE_POSTURES = {"hundred", "single_leg_stretch", "double_leg_stretch", "single_leg_circles"}
# Exercises performed face down.
_PRONE_POSTURES = {"plank"}
# Exercises performed sitting on the mat.
_SEATED_POSTURES = {"spine_stretch", "rolling_like_a_ball"}


def _is_standing(lm) -> bool:
    """
    Standing has the ankle far below the hip; lying, sitting (legs extended or
    tucked) all keep hip and ankle roughly at the same height. Using only these two
    landmarks (not the shoulder) keeps this stable through forward folds, which the
    previous shoulder-based version could misread as "standing".
    """
    hip = _lm(lm, _L_HIP)
    ankle = _lm(lm, _L_ANKLE)
    return abs(hip[1] - ankle[1]) > _STANDING_HIP_ANKLE_GAP


def _torso_incline_degrees(lm) -> float:
    """0° = shoulder-hip line perfectly horizontal (lying down), 90° = perfectly
    vertical (sitting/standing upright)."""
    shoulder = _lm(lm, _L_SHOULDER)
    hip = _lm(lm, _L_HIP)
    dx = hip[0] - shoulder[0]
    dy = hip[1] - shoulder[1]
    if dx == 0 and dy == 0:
        return 90.0
    return math.degrees(math.atan2(abs(dy), abs(dx)))


def _orientation_issue(lm, posture_id: str) -> Optional[str]:
    """Sanity-check the user's base position before running the exercise-specific
    checks, with a message tailored to what that exercise actually requires."""
    if posture_id in _SUPINE_POSTURES:
        if _torso_incline_degrees(lm) > _SUPINE_MAX_INCLINE_DEGREES:
            return "Túmbate boca arriba en la colchoneta para hacer este ejercicio."
    elif posture_id in _PRONE_POSTURES:
        if _is_standing(lm):
            return "Túmbate boca abajo en la colchoneta para hacer este ejercicio."
    elif posture_id in _SEATED_POSTURES:
        if _is_standing(lm):
            return "Siéntate en la colchoneta para hacer este ejercicio."
    return None


_ANALYZERS = {
    "plank": _analyze_plank,
    "hundred": _analyze_hundred,
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

    orientation_issue = _orientation_issue(lm, posture_id)
    if orientation_issue:
        return {
            "isCorrect": False,
            "score": 0.0,
            "corrections": [orientation_issue],
            "landmarks": [{"x": l.x, "y": l.y, "z": l.z, "visibility": l.visibility} for l in lm],
            "incorrectLandmarks": [_L_SHOULDER, _R_SHOULDER, _L_HIP, _L_ANKLE],
        }

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
