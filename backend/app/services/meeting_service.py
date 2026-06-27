import secrets
from datetime import datetime, timezone
from sqlalchemy.orm import Session, joinedload
from fastapi import HTTPException, status

from app.models.meeting import Meeting, MeetingParticipant
from app.models.user import User
from app.schemas.meeting import MeetingCreate


def _meeting_code() -> str:
    return "-".join([secrets.token_hex(2), secrets.token_hex(2), secrets.token_hex(2)]).upper()


def create_meeting(db: Session, host: User, payload: MeetingCreate) -> Meeting:
    code = _meeting_code()
    while db.query(Meeting).filter(Meeting.meeting_id == code).first():
        code = _meeting_code()
    meeting = Meeting(
        meeting_id=code,
        title=payload.title.strip(),
        host_id=host.id,
        waiting_room_enabled=payload.waiting_room_enabled,
    )
    db.add(meeting)
    db.commit()
    db.refresh(meeting)
    add_participant(db, meeting, host)
    return get_meeting(db, code)


def get_meeting(db: Session, meeting_id: str) -> Meeting:
    meeting = (
        db.query(Meeting)
        .options(joinedload(Meeting.host), joinedload(Meeting.participants).joinedload(MeetingParticipant.user))
        .filter(Meeting.meeting_id == meeting_id.upper())
        .first()
    )
    if not meeting:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Meeting not found")
    return meeting


def list_user_meetings(db: Session, user: User) -> list[Meeting]:
    hosted_ids = db.query(Meeting.id).filter(Meeting.host_id == user.id)
    joined_ids = db.query(MeetingParticipant.meeting_id_fk).filter(MeetingParticipant.user_id == user.id)
    return (
        db.query(Meeting)
        .options(joinedload(Meeting.host), joinedload(Meeting.participants).joinedload(MeetingParticipant.user))
        .filter(Meeting.id.in_(hosted_ids.union(joined_ids)))
        .order_by(Meeting.created_at.desc())
        .limit(25)
        .all()
    )


def add_participant(db: Session, meeting: Meeting, user: User) -> MeetingParticipant:
    participant = (
        db.query(MeetingParticipant)
        .filter(MeetingParticipant.meeting_id_fk == meeting.id, MeetingParticipant.user_id == user.id)
        .order_by(MeetingParticipant.id.desc())
        .first()
    )
    if participant and participant.left_at is None and not participant.was_removed:
        return participant
    participant = MeetingParticipant(meeting_id_fk=meeting.id, user_id=user.id)
    db.add(participant)
    db.commit()
    db.refresh(participant)
    return participant


def end_participation(db: Session, meeting_id: str, user_id: int, removed: bool = False) -> None:
    meeting = db.query(Meeting).filter(Meeting.meeting_id == meeting_id.upper()).first()
    if not meeting:
        return
    participant = (
        db.query(MeetingParticipant)
        .filter(MeetingParticipant.meeting_id_fk == meeting.id, MeetingParticipant.user_id == user_id, MeetingParticipant.left_at.is_(None))
        .order_by(MeetingParticipant.id.desc())
        .first()
    )
    if participant:
        participant.left_at = datetime.now(timezone.utc)
        participant.was_removed = removed
        db.commit()


def end_meeting(db: Session, meeting_id: str) -> bool:
    meeting = db.query(Meeting).filter(Meeting.meeting_id == meeting_id.upper()).first()
    if not meeting or not meeting.is_active:
        return False

    ended_at = datetime.now(timezone.utc)
    meeting.is_active = False
    meeting.ended_at = ended_at
    (
        db.query(MeetingParticipant)
        .filter(MeetingParticipant.meeting_id_fk == meeting.id, MeetingParticipant.left_at.is_(None))
        .update({MeetingParticipant.left_at: ended_at}, synchronize_session=False)
    )
    db.commit()
    return True
