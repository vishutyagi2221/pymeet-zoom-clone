from datetime import datetime
from pydantic import BaseModel, Field, field_validator

from app.schemas.user import UserOut


class MeetingCreate(BaseModel):
    title: str = Field(default="PyMeet Meeting", min_length=1, max_length=180)
    waiting_room_enabled: bool = True

    @field_validator("title", mode="before")
    @classmethod
    def normalize_title(cls, value: str | None) -> str:
        title = (value or "").strip()
        return title or "PyMeet Meeting"


class MeetingJoin(BaseModel):
    meeting_id: str = Field(min_length=6, max_length=32)

    @field_validator("meeting_id", mode="before")
    @classmethod
    def normalize_meeting_id(cls, value: str) -> str:
        return str(value).strip().upper()


class ParticipantOut(BaseModel):
    id: int
    user: UserOut
    joined_at: datetime
    left_at: datetime | None = None
    was_removed: bool

    model_config = {"from_attributes": True}


class MeetingOut(BaseModel):
    id: int
    meeting_id: str
    title: str
    waiting_room_enabled: bool
    is_active: bool
    created_at: datetime
    ended_at: datetime | None = None
    host: UserOut
    participants: list[ParticipantOut] = []

    model_config = {"from_attributes": True}
