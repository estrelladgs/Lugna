from typing import List, Optional
from pydantic import BaseModel

from app.schemas.posture import LandmarkOut


class FeedbackIn(BaseModel):
    isCorrect: bool
    score: float
    corrections: List[str]
    landmarks: Optional[List[LandmarkOut]] = None


class SessionIn(BaseModel):
    id: str
    postureId: str
    startedAt: str
    endedAt: Optional[str] = None
    durationSeconds: int
    averageScore: float
    feedbackHistory: List[FeedbackIn]


class SessionOut(BaseModel):
    id: str
    postureId: str
    startedAt: str
    endedAt: Optional[str] = None
    durationSeconds: int
    averageScore: float
    feedbackHistory: List[FeedbackIn]

    class Config:
        from_attributes = True
