from datetime import datetime, timezone
from sqlalchemy import DateTime, ForeignKey, Integer, String, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Meeting(Base):
    __tablename__ = "meetings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    meeting_id: Mapped[str] = mapped_column(String(32), unique=True, index=True, nullable=False)
    title: Mapped[str] = mapped_column(String(180), nullable=False, default="PyMeet Meeting")
    host_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    waiting_room_enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    ended_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    host = relationship("User", back_populates="hosted_meetings")
    participants = relationship("MeetingParticipant", back_populates="meeting", cascade="all, delete-orphan")


class MeetingParticipant(Base):
    __tablename__ = "meeting_participants"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    meeting_id_fk: Mapped[int] = mapped_column(ForeignKey("meetings.id"), nullable=False)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    joined_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    left_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    was_removed: Mapped[bool] = mapped_column(Boolean, default=False)

    meeting = relationship("Meeting", back_populates="participants")
    user = relationship("User", back_populates="participations")
