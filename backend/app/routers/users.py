from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.dependencies import get_current_user, get_db
from app.models.session import PostureSession, RoutineSession
from app.models.user import User
from app.schemas.auth import UpdateProfileRequest, UserOut

router = APIRouter(prefix="/users", tags=["users"])


@router.patch("/me", response_model=UserOut)
def update_me(
    payload: UpdateProfileRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if payload.email != current_user.email:
        existing = db.query(User).filter(User.email == payload.email).first()
        if existing:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="El email ya está registrado")

    current_user.name = payload.name
    current_user.email = payload.email
    db.commit()
    db.refresh(current_user)

    return UserOut(
        id=str(current_user.id),
        email=current_user.email,
        name=current_user.name,
        createdAt=current_user.created_at.isoformat(),
    )


@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
def delete_me(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    db.query(PostureSession).filter(PostureSession.user_id == current_user.id).delete()
    db.query(RoutineSession).filter(RoutineSession.user_id == current_user.id).delete()
    db.query(User).filter(User.id == current_user.id).delete()
    db.commit()
