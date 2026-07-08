import uuid
from datetime import datetime

from sqlalchemy import Column, String, DateTime, ForeignKey

from app.database import Base


class CameraConsent(Base):
    __tablename__ = "camera_consents"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    policy_version = Column(String, nullable=False)
    granted_at = Column(DateTime, default=datetime.utcnow)
