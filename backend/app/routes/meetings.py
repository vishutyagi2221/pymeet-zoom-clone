from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.schemas.meeting import MeetingCreate, MeetingJoin, MeetingOut
from app.services.auth_service import get_current_user
from app.services.meeting_service import add_participant, create_meeting, get_meeting, list_user_meetings

router = APIRouter(prefix="/api/meetings", tags=["Meetings"])


@router.post("", response_model=MeetingOut, status_code=status.HTTP_201_CREATED)
def create(payload: MeetingCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return create_meeting(db, current_user, payload)


@router.get("", response_model=list[MeetingOut])
def history(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return list_user_meetings(db, current_user)


@router.get("/{meeting_id}", response_model=MeetingOut)
def details(meeting_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return get_meeting(db, meeting_id)


@router.post("/join", response_model=MeetingOut)
def join(payload: MeetingJoin, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    meeting = get_meeting(db, payload.meeting_id)
    if not meeting.is_active:
        raise HTTPException(status_code=status.HTTP_410_GONE, detail="Meeting has ended")
    if not meeting.waiting_room_enabled or meeting.host_id == current_user.id:
        add_participant(db, meeting, current_user)
    return get_meeting(db, payload.meeting_id)

