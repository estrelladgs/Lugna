from typing import List, Optional
from pydantic import BaseModel


class PostureOut(BaseModel):
    id: str
    name: str
    description: str
    difficulty: str
    muscleGroups: List[str]
    imageUrl: Optional[str] = None

    class Config:
        from_attributes = True


class RoutineOut(BaseModel):
    id: str
    name: str
    description: str
    durationMinutes: int
    difficulty: str
    enlace: Optional[str] = None

    class Config:
        from_attributes = True


class LandmarkOut(BaseModel):
    x: float
    y: float
    z: float
    visibility: Optional[float] = None


class AnalyzeRequest(BaseModel):
    postureId: str
    frame: str


class PostureFeedbackOut(BaseModel):
    isCorrect: bool
    score: float
    corrections: List[str]
    landmarks: Optional[List[LandmarkOut]] = None
    incorrectLandmarks: List[int] = []
