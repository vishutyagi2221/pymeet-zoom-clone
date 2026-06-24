from __future__ import annotations

import asyncio
from dataclasses import asdict, dataclass
from typing import Any

import socketio

from app.config import settings
from app.database import SessionLocal
from app.models.user import User
from app.services.meeting_service import end_meeting, end_participation, get_meeting
from app.utils.security import decode_token

sio = socketio.AsyncServer(
    async_mode="asgi",
    cors_allowed_origins="*",
    logger=False,
    engineio_logger=False,
)


@dataclass
class RoomUser:
    sid: str
    id: int
    name: str
    email: str
    avatar_color: str
    is_host: bool
    is_waiting: bool = False


rooms: dict[str, dict[str, RoomUser]] = {}
sid_to_room: dict[str, str] = {}
sid_to_user: dict[str, RoomUser] = {}
waiting_rooms: dict[str, dict[str, RoomUser]] = {}


def _serialize(room: dict[str, RoomUser]) -> list[dict[str, Any]]:
    return [asdict(user) for user in room.values()]


def _sync_get_user(token: str | None) -> User | None:
    if not token:
        return None
    payload = decode_token(token.replace("Bearer ", ""))
    if not payload or not payload.get("sub"):
        return None
    db = SessionLocal()
    try:
        return db.get(User, int(payload["sub"]))
    finally:
        db.close()


def _sync_get_meeting(meeting_id: str):
    db = SessionLocal()
    try:
        return get_meeting(db, meeting_id)
    finally:
        db.close()


def _sync_end_participation(meeting_id: str, user_id: int, removed: bool = False):
    db = SessionLocal()
    try:
        end_participation(db, meeting_id, user_id, removed=removed)
    finally:
        db.close()


def _sync_end_meeting(meeting_id: str) -> bool:
    db = SessionLocal()
    try:
        return end_meeting(db, meeting_id)
    finally:
        db.close()


@sio.event
async def connect(sid: str, environ: dict[str, Any], auth: dict[str, Any] | None):
    user = await asyncio.to_thread(_sync_get_user, (auth or {}).get("token"))
    if not user:
        raise ConnectionRefusedError("Authentication required")
    sid_to_user[sid] = RoomUser(sid=sid, id=user.id, name=user.name, email=user.email, avatar_color=user.avatar_color, is_host=False)
    await sio.emit("connected", {"sid": sid}, to=sid)


@sio.on("join-room")
async def join_room(sid: str, data: dict[str, Any]):
    meeting_id = str(data.get("meetingId", "")).upper()
    meeting = await asyncio.to_thread(_sync_get_meeting, meeting_id)

    if not meeting.is_active:
        await sio.emit("meeting-ended", {"meetingId": meeting_id, "reason": "host-ended"}, to=sid)
        return

    user = sid_to_user[sid]
    user.is_host = meeting.host_id == user.id
    room = rooms.setdefault(meeting_id, {})
    waiting = waiting_rooms.setdefault(meeting_id, {})

    if meeting.waiting_room_enabled and not user.is_host:
        user.is_waiting = True
        waiting[sid] = user
        await sio.enter_room(sid, f"waiting:{meeting_id}")
        await sio.emit("waiting-room", {"meetingId": meeting_id}, to=sid)
        await sio.emit("waiting-list", {"participants": _serialize(waiting)}, room=meeting_id)
        return

    user.is_waiting = False
    room[sid] = user
    sid_to_room[sid] = meeting_id
    await sio.enter_room(sid, meeting_id)
    await sio.emit("room-joined", {"meetingId": meeting_id, "self": asdict(user), "participants": _serialize(room)}, to=sid)
    await sio.emit("participant-list", {"participants": _serialize(room)}, room=meeting_id)
    await sio.emit("user-joined", {"user": asdict(user)}, room=meeting_id, skip_sid=sid)


@sio.on("admit-participant")
async def admit_participant(sid: str, data: dict[str, Any]):
    meeting_id = str(data.get("meetingId", "")).upper()
    target_sid = data.get("sid")
    host = sid_to_user.get(sid)
    if not host or not host.is_host:
        return
    user = waiting_rooms.get(meeting_id, {}).pop(target_sid, None)
    if not user:
        return
    user.is_waiting = False
    rooms.setdefault(meeting_id, {})[target_sid] = user
    sid_to_room[target_sid] = meeting_id
    await sio.leave_room(target_sid, f"waiting:{meeting_id}")
    await sio.enter_room(target_sid, meeting_id)
    await sio.emit("room-joined", {"meetingId": meeting_id, "self": asdict(user), "participants": _serialize(rooms[meeting_id])}, to=target_sid)
    await sio.emit("participant-list", {"participants": _serialize(rooms[meeting_id])}, room=meeting_id)
    await sio.emit("user-joined", {"user": asdict(user)}, room=meeting_id, skip_sid=target_sid)


@sio.on("waiting-list")
async def waiting_list(sid: str, data: dict[str, Any]):
    meeting_id = str(data.get("meetingId", "")).upper()
    host = sid_to_user.get(sid)
    if host and host.is_host:
        await sio.emit("waiting-list", {"participants": _serialize(waiting_rooms.get(meeting_id, {}))}, to=sid)


@sio.on("offer")
async def offer(sid: str, data: dict[str, Any]):
    target = data.get("to")
    if not target or not isinstance(target, str) or target not in sid_to_room or sid_to_room[target] != sid_to_room.get(sid):
        return
    await sio.emit("offer", {**data, "from": sid}, to=target)


@sio.on("answer")
async def answer(sid: str, data: dict[str, Any]):
    target = data.get("to")
    if not target or not isinstance(target, str) or target not in sid_to_room or sid_to_room[target] != sid_to_room.get(sid):
        return
    await sio.emit("answer", {**data, "from": sid}, to=target)


@sio.on("ice-candidate")
async def ice_candidate(sid: str, data: dict[str, Any]):
    target = data.get("to")
    if not target or not isinstance(target, str) or target not in sid_to_room or sid_to_room[target] != sid_to_room.get(sid):
        return
    await sio.emit("ice-candidate", {**data, "from": sid}, to=target)


@sio.on("chat-message")
async def chat_message(sid: str, data: dict[str, Any]):
    meeting_id = sid_to_room.get(sid)
    user = sid_to_user.get(sid)
    if meeting_id and user:
        target = data.get("target")
        room_dict = rooms.get(meeting_id, {})
        if target and target in room_dict:
            # Send private message only to the target
            await sio.emit("chat-message", {"message": data.get("message", ""), "user": asdict(user), "sentAt": data.get("sentAt"), "isPrivate": True}, to=target)
        else:
            # Broadcast to everyone
            await sio.emit("chat-message", {"message": data.get("message", ""), "user": asdict(user), "sentAt": data.get("sentAt")}, room=meeting_id, skip_sid=sid)


@sio.on("media-state")
async def media_state(sid: str, data: dict[str, Any]):
    meeting_id = sid_to_room.get(sid)
    if meeting_id:
        await sio.emit("media-state", {**data, "sid": sid}, room=meeting_id, skip_sid=sid)


@sio.on("send-reaction")
async def send_reaction(sid: str, data: dict[str, Any]):
    meeting_id = sid_to_room.get(sid)
    if meeting_id:
        await sio.emit("receive-reaction", {"sid": sid, "emoji": data.get("emoji")}, room=meeting_id)


@sio.on("remove-participant")
async def remove_participant(sid: str, data: dict[str, Any]):
    meeting_id = str(data.get("meetingId", "")).upper()
    target_sid = data.get("sid")
    host = sid_to_user.get(sid)
    if not host or not host.is_host:
        return
    room = rooms.get(meeting_id, {})
    target = room.pop(target_sid, None)
    if target:
        await asyncio.to_thread(_sync_end_participation, meeting_id, target.id, True)
        await sio.emit("removed-from-room", {"meetingId": meeting_id}, to=target_sid)
        await sio.disconnect(target_sid)
        await sio.emit("participant-list", {"participants": _serialize(room)}, room=meeting_id)


@sio.on("user-left")
async def user_left(sid: str, data: dict[str, Any] | None = None):
    await _leave(sid)


@sio.on("end-meeting")
async def end_meeting_for_everyone(sid: str, data: dict[str, Any] | None = None):
    meeting_id = str((data or {}).get("meetingId", sid_to_room.get(sid, ""))).upper()
    user = sid_to_user.get(sid)
    if not meeting_id or not user or not user.is_host or sid_to_room.get(sid) != meeting_id:
        return
    await _end_room(meeting_id)


@sio.event
async def disconnect(sid: str):
    await _leave(sid)


async def _end_room(meeting_id: str):
    room = rooms.get(meeting_id, {})
    waiting = waiting_rooms.get(meeting_id, {})
    await asyncio.to_thread(_sync_end_meeting, meeting_id)

    payload = {"meetingId": meeting_id, "reason": "host-ended"}
    await sio.emit("meeting-ended", payload, room=meeting_id)
    await sio.emit("meeting-ended", payload, room=f"waiting:{meeting_id}")

    for member_sid in list(room):
        sid_to_room.pop(member_sid, None)

    await sio.close_room(meeting_id)
    await sio.close_room(f"waiting:{meeting_id}")

    rooms.pop(meeting_id, None)
    waiting_rooms.pop(meeting_id, None)


async def _leave(sid: str):
    meeting_id = sid_to_room.pop(sid, None)
    user = sid_to_user.get(sid)

    # Clean up waiting room entries
    for wm_id, waiting in list(waiting_rooms.items()):
        if sid in waiting:
            waiting.pop(sid, None)
            await sio.leave_room(sid, f"waiting:{wm_id}")
            # Notify host of updated waiting list
            await sio.emit("waiting-list", {"participants": _serialize(waiting)}, room=wm_id)
            if not waiting:
                del waiting_rooms[wm_id]

    if not meeting_id or not user:
        sid_to_user.pop(sid, None)
        return

    if user.is_host:
        await _end_room(meeting_id)
        sid_to_user.pop(sid, None)
        return
    rooms.get(meeting_id, {}).pop(sid, None)
    # Clean up empty rooms
    if meeting_id in rooms and not rooms[meeting_id]:
        del rooms[meeting_id]
    await asyncio.to_thread(_sync_end_participation, meeting_id, user.id)
    await sio.emit("user-left", {"sid": sid, "userId": user.id}, room=meeting_id)
    await sio.emit("participant-list", {"participants": _serialize(rooms.get(meeting_id, {}))}, room=meeting_id)
    sid_to_user.pop(sid, None)
