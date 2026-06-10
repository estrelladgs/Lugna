from typing import List, Optional
from pydantic import BaseModel


class LiveClassOut(BaseModel):
    id: str
    title: str
    instructorName: str
    scheduledAt: str
    durationMinutes: int
    difficulty: str
    enlace: Optional[str] = None


class ActivityOut(BaseModel):
    activeDays: List[str]
    streakDays: int


class ProgressOut(BaseModel):
    completedLevels: int
    totalLevels: int
    percentage: float


class ContinueRoutineOut(BaseModel):
    id: str
    name: str
    durationMinutes: int
    progressPercent: float
    enlace: Optional[str] = None
