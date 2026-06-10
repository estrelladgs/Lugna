from datetime import datetime

from sqlalchemy import Column, String, JSON, Integer, DateTime

from app.database import Base


class Posture(Base):
    __tablename__ = "postures"

    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    description = Column(String, nullable=False)
    difficulty = Column(String, nullable=False)
    muscle_groups = Column(JSON, nullable=False, default=list)
    image_url = Column(String, nullable=True)


class Routine(Base):
    __tablename__ = "routines"

    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    description = Column(String, nullable=False)
    duration_minutes = Column(String, nullable=False)
    difficulty = Column(String, nullable=False)
    enlace = Column(String, nullable=True)


class LiveClass(Base):
    __tablename__ = "live_classes"

    id = Column(String, primary_key=True)
    title = Column(String, nullable=False)
    instructor_name = Column(String, nullable=False)
    scheduled_at = Column(DateTime, nullable=False)
    duration_minutes = Column(Integer, nullable=False)
    difficulty = Column(String, nullable=False)
    enlace = Column(String, nullable=True)
