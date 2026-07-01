from datetime import datetime, timedelta
from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.dependencies import get_current_user, get_db
from app.models.posture import LiveClass, Posture, Routine
from app.models.session import PostureSession, RoutineSession
from app.models.user import User
from app.schemas.home import ActivityOut, ContinueRoutineOut, LiveClassOut, ProgressOut

router = APIRouter(prefix="/home", tags=["home"])


@router.get("/live-classes", response_model=List[LiveClassOut])
def get_live_classes(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    now = datetime.utcnow()
    classes = (
        db.query(LiveClass)
        .filter(LiveClass.scheduled_at >= now)
        .order_by(LiveClass.scheduled_at)
        .limit(6)
        .all()
    )
    return [
        LiveClassOut(
            id=c.id,
            title=c.title,
            instructorName=c.instructor_name,
            scheduledAt=c.scheduled_at.isoformat(),
            durationMinutes=c.duration_minutes,
            difficulty=c.difficulty,
            enlace=c.enlace,
        )
        for c in classes
    ]


@router.get("/activity", response_model=ActivityOut)
def get_activity(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    sessions = (
        db.query(PostureSession)
        .filter(PostureSession.user_id == current_user.id)
        .all()
    )
    active_dates: set[str] = set()
    for s in sessions:
        if s.created_at:
            active_dates.add(s.created_at.date().isoformat())

    today = datetime.utcnow().date()
    streak = 0
    current_date = today
    while current_date.isoformat() in active_dates:
        streak += 1
        current_date -= timedelta(days=1)

    return ActivityOut(activeDays=sorted(active_dates), streakDays=streak)


@router.get("/progress", response_model=ProgressOut)
def get_progress(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    total = db.query(Routine).count()
    sessions = (
        db.query(RoutineSession)
        .filter(RoutineSession.user_id == current_user.id)
        .all()
    )
    completed = len({s.routine_id for s in sessions})
    percentage = round(completed / total * 100, 1) if total > 0 else 0.0

    return ProgressOut(completedLevels=completed, totalLevels=total, percentage=percentage)


@router.get("/continue-routine", response_model=ContinueRoutineOut)
def get_continue_routine(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    routine = None
    if current_user.last_routine_id:
        routine = db.query(Routine).filter(Routine.id == current_user.last_routine_id).first()

    if not routine:
        routine = db.query(Routine).first()

    if not routine:
        return ContinueRoutineOut(
            id="", name="Sin rutina asignada", durationMinutes=0, progressPercent=0
        )

    return ContinueRoutineOut(
        id=routine.id,
        name=routine.name,
        durationMinutes=int(routine.duration_minutes),
        progressPercent=0.6,
        enlace=routine.enlace,
    )
