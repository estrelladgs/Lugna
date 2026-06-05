from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.dependencies import get_current_user, get_db
from app.models.posture import Posture, Routine
from app.models.user import User
from app.schemas.posture import AnalyzeRequest, PostureFeedbackOut, PostureOut, RoutineOut
from app.services.analysis import analyze_posture

router = APIRouter(tags=["postures"])


@router.get("/postures", response_model=List[PostureOut])
def list_postures(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    postures = db.query(Posture).all()
    return [
        PostureOut(
            id=p.id,
            name=p.name,
            description=p.description,
            difficulty=p.difficulty,
            muscleGroups=p.muscle_groups,
            imageUrl=p.image_url,
        )
        for p in postures
    ]


@router.get("/postures/{posture_id}", response_model=PostureOut)
def get_posture(posture_id: str, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    posture = db.query(Posture).filter(Posture.id == posture_id).first()
    if not posture:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Postura no encontrada")
    return PostureOut(
        id=posture.id,
        name=posture.name,
        description=posture.description,
        difficulty=posture.difficulty,
        muscleGroups=posture.muscle_groups,
        imageUrl=posture.image_url,
    )


@router.post("/posture/analyze", response_model=PostureFeedbackOut)
def analyze(
    payload: AnalyzeRequest,
    _: User = Depends(get_current_user),
):
    result = analyze_posture(payload.postureId, payload.frame)
    return PostureFeedbackOut(**result)


@router.get("/routines", response_model=List[RoutineOut])
def list_routines(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    routines = db.query(Routine).all()
    return [
        RoutineOut(
            id=r.id,
            name=r.name,
            description=r.description,
            durationMinutes=int(r.duration_minutes),
            difficulty=r.difficulty,
            postures=r.postures,
        )
        for r in routines
    ]
