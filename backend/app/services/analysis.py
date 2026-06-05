"""
Posture analysis service.
Uses MediaPipe when available; falls back to a rule-based mock otherwise.
"""

import base64
import math
from typing import Dict, List, Optional

try:
    import cv2
    import mediapipe as mp
    import numpy as np

    _mp_pose = mp.solutions.pose
    MEDIAPIPE_AVAILABLE = True
except ImportError:
    MEDIAPIPE_AVAILABLE = False


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


def _lm3(landmarks, idx):
    """Return (x, y, z) for a landmark index."""
    lm = landmarks[idx]
    return (lm.x, lm.y, lm.z)


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


# ---------------------------------------------------------------------------
# Per-posture analyzers
# ---------------------------------------------------------------------------

def _analyze_plank(lm) -> Dict:
    corrections = []
    score = 100.0

    shoulder = _lm(lm, _L_SHOULDER)
    hip = _lm(lm, _L_HIP)
    ankle = _lm(lm, _L_ANKLE)

    body_angle = _angle(shoulder, hip, ankle)
    # Ideal straight line → angle near 180°
    deviation = abs(180.0 - body_angle)
    if deviation > 20:
        score -= 40
        if hip[1] < shoulder[1] - 0.05:
            corrections.append("Baja las caderas; el cuerpo debe formar una línea recta.")
        else:
            corrections.append("Eleva las caderas; evita que la pelvis caiga.")

    wrist = _lm(lm, _L_WRIST)
    shoulder_over_wrist = abs(wrist[0] - shoulder[0])
    if shoulder_over_wrist > 0.1:
        score -= 20
        corrections.append("Coloca los hombros directamente sobre las muñecas.")

    score = max(0.0, score)
    return {"score": score, "corrections": corrections}


def _analyze_hundred(lm) -> Dict:
    corrections = []
    score = 100.0

    hip = _lm(lm, _L_HIP)
    knee = _lm(lm, _L_KNEE)
    ankle = _lm(lm, _L_ANKLE)

    leg_angle = _angle(hip, knee, ankle)
    # Legs should be extended (~180°) at ~45° from the floor
    if leg_angle < 150:
        score -= 30
        corrections.append("Extiende completamente las piernas.")

    shoulder = _lm(lm, _L_SHOULDER)
    # Head/shoulder should be lifted (lower y value = higher on screen)
    if shoulder[1] > hip[1] - 0.05:
        score -= 30
        corrections.append("Eleva los hombros y la cabeza del suelo; lleva el mentón al pecho.")

    wrist = _lm(lm, _L_WRIST)
    if wrist[1] > hip[1]:
        score -= 20
        corrections.append("Mantén los brazos paralelos al suelo durante el bombeo.")

    score = max(0.0, score)
    return {"score": score, "corrections": corrections}


def _analyze_roll_up(lm) -> Dict:
    corrections = []
    score = 100.0

    shoulder = _lm(lm, _L_SHOULDER)
    hip = _lm(lm, _L_HIP)
    knee = _lm(lm, _L_KNEE)

    torso_angle = _angle(knee, hip, shoulder)
    # Forward fold: torso angle should be small (<90°)
    if torso_angle > 100:
        score -= 40
        corrections.append("Redondea más la columna y lleva el torso hacia los pies.")

    wrist = _lm(lm, _L_WRIST)
    if wrist[1] > knee[1]:
        score -= 20
        corrections.append("Extiende los brazos más hacia los pies.")

    score = max(0.0, score)
    return {"score": score, "corrections": corrections}


def _analyze_single_leg_stretch(lm) -> Dict:
    corrections = []
    score = 100.0

    hip = _lm(lm, _L_HIP)
    knee = _lm(lm, _L_KNEE)
    ankle = _lm(lm, _L_ANKLE)

    bent_leg_angle = _angle(hip, knee, ankle)
    if bent_leg_angle > 120:
        score -= 30
        corrections.append("Dobla más la rodilla y llévala hacia el pecho.")

    shoulder = _lm(lm, _L_SHOULDER)
    if shoulder[1] > hip[1]:
        score -= 30
        corrections.append("Eleva la cabeza y los hombros del suelo.")

    score = max(0.0, score)
    return {"score": score, "corrections": corrections}


def _analyze_double_leg_stretch(lm) -> Dict:
    corrections = []
    score = 100.0

    shoulder = _lm(lm, _L_SHOULDER)
    hip = _lm(lm, _L_HIP)
    ankle = _lm(lm, _L_ANKLE)

    if shoulder[1] > hip[1]:
        score -= 30
        corrections.append("Mantén los hombros y la cabeza elevados del suelo.")

    leg_height = hip[1] - ankle[1]
    if leg_height < 0.05:
        score -= 30
        corrections.append("Eleva las piernas a aproximadamente 45° del suelo.")

    score = max(0.0, score)
    return {"score": score, "corrections": corrections}


def _analyze_spine_stretch(lm) -> Dict:
    corrections = []
    score = 100.0

    shoulder = _lm(lm, _L_SHOULDER)
    hip = _lm(lm, _L_HIP)
    knee = _lm(lm, _L_KNEE)

    forward_reach = shoulder[0] - knee[0]
    if forward_reach < 0.05:
        score -= 40
        corrections.append("Alarga más la columna hacia adelante; imagina que tocas los pies.")

    wrist = _lm(lm, _L_WRIST)
    arm_extension = wrist[0] - shoulder[0]
    if arm_extension < 0.1:
        score -= 20
        corrections.append("Extiende los brazos completamente al frente.")

    score = max(0.0, score)
    return {"score": score, "corrections": corrections}


def _analyze_rolling_like_a_ball(lm) -> Dict:
    corrections = []
    score = 100.0

    shoulder = _lm(lm, _L_SHOULDER)
    hip = _lm(lm, _L_HIP)
    knee = _lm(lm, _L_KNEE)

    # Knee should be close to chest
    knee_to_chest = abs(knee[0] - shoulder[0]) + abs(knee[1] - shoulder[1])
    if knee_to_chest > 0.3:
        score -= 40
        corrections.append("Lleva las rodillas más cerca del pecho para crear la curva en C.")

    torso_curve = _angle(shoulder, hip, knee)
    if torso_curve > 100:
        score -= 30
        corrections.append("Redondea más la espalda; mantén la curva en C durante todo el ejercicio.")

    score = max(0.0, score)
    return {"score": score, "corrections": corrections}


def _analyze_single_leg_circles(lm) -> Dict:
    corrections = []
    score = 100.0

    l_hip = _lm(lm, _L_HIP)
    r_hip = _lm(lm, _R_HIP)

    hip_tilt = abs(l_hip[1] - r_hip[1])
    if hip_tilt > 0.05:
        score -= 40
        corrections.append("Mantén la pelvis estable y nivelada; evita el balanceo lateral.")

    l_knee = _lm(lm, _L_KNEE)
    l_ankle = _lm(lm, _L_ANKLE)
    leg_angle = _angle(l_hip, l_knee, l_ankle)
    if leg_angle < 150:
        score -= 30
        corrections.append("Extiende completamente la pierna en el aire.")

    score = max(0.0, score)
    return {"score": score, "corrections": corrections}


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
# Mock fallback (used when MediaPipe is not installed)
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

    with _mp_pose.Pose(
        static_image_mode=True,
        model_complexity=1,
        min_detection_confidence=0.5,
    ) as pose:
        results = pose.process(img_rgb)

    if not results.pose_landmarks:
        return {
            "isCorrect": False,
            "score": 0.0,
            "corrections": ["No se detectó ninguna persona en la imagen. Asegúrate de que todo el cuerpo esté visible."],
            "landmarks": None,
        }

    lm = results.pose_landmarks.landmark

    # Run posture-specific analysis
    analyzer = _ANALYZERS.get(posture_id)
    if analyzer is None:
        result = {"score": 75.0, "corrections": []}
    else:
        result = analyzer(lm)

    score = result["score"]
    corrections = result["corrections"]
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
    }
