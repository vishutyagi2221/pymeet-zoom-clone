from datetime import datetime
from pydantic import BaseModel, Field

from app.schemas.user import UserOut


class MeetingCreate(BaseModel):
    title: str = Field(default="PyMeet Meeting", min_length=1, max_length=180)
    waiting_room_enabled: bool = True


class MeetingJoin(BaseModel):
    meeting_id: str = Field(min_length=6, max_length=32)


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
