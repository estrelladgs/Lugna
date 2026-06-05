from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.dependencies import get_current_user, get_db
from app.models.session import PostureSession
from app.models.user import User
from app.schemas.session import SessionIn, SessionOut

router = APIRouter(prefix="/posture", tags=["sessions"])


@router.post("/sessions", response_model=SessionOut, status_code=201)
def save_session(
    payload: SessionIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    session = PostureSession(
        id=payload.id,
        user_id=current_user.id,
        posture_id=payload.postureId,
        started_at=payload.startedAt,
        ended_at=payload.endedAt,
        duration_seconds=payload.durationSeconds,
        average_score=payload.averageScore,
        feedback_history=[f.model_dump() for f in payload.feedbackHistory],
    )
    db.merge(session)
    db.commit()

    return SessionOut(
        id=str(session.id),
        postureId=session.posture_id,
        startedAt=session.started_at,
        endedAt=session.ended_at,
        durationSeconds=session.duration_seconds,
        averageScore=session.average_score,
        feedbackHistory=payload.feedbackHistory,
    )


@router.get("/sessions", response_model=List[SessionOut])
def get_sessions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    sessions = (
        db.query(PostureSession)
        .filter(PostureSession.user_id == current_user.id)
        .order_by(PostureSession.created_at.desc())
        .all()
    )
    return [
        SessionOut(
            id=str(s.id),
            postureId=s.posture_id,
            startedAt=s.started_at,
            endedAt=s.ended_at,
            durationSeconds=s.duration_seconds,
            averageScore=s.average_score,
            feedbackHistory=s.feedback_history,
        )
        for s in sessions
    ]
