from typing import List
from pydantic import BaseModel


class LiveClassOut(BaseModel):
    id: str
    title: str
    instructorName: str
    scheduledAt: str
    durationMinutes: int
    difficulty: str


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
