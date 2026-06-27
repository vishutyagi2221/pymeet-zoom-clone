from pathlib import Path

import socketio
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.database import Base, engine
from app.models import Meeting, MeetingParticipant, User  # noqa: F401
from app.routes import auth, meetings
from app.websocket.signaling import sio

Base.metadata.create_all(bind=engine)

ALLOWED_ORIGINS = settings.frontend_origins

fastapi_app = FastAPI(title=settings.app_name, version="1.0.0")
fastapi_app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept"],
)
fastapi_app.include_router(auth.router)
fastapi_app.include_router(meetings.router)


@fastapi_app.get("/api/health", tags=["System"])
def health():
    return {"status": "ok", "service": settings.app_name}


static_dir = Path(__file__).resolve().parent / "static"
index_file = static_dir / "index.html"

if index_file.exists():
    assets_dir = static_dir / "assets"
    if assets_dir.exists():
        fastapi_app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @fastapi_app.get("/", include_in_schema=False)
    @fastapi_app.get("/{full_path:path}", include_in_schema=False)
    def serve_spa(full_path: str = ""):
        if full_path.startswith(("api/", "socket.io")):
            raise HTTPException(status_code=404)
        target = (static_dir / full_path).resolve()
        if target.is_file() and static_dir in target.parents:
            return FileResponse(target)
        return FileResponse(index_file)


app = socketio.ASGIApp(sio, other_asgi_app=fastapi_app, socketio_path="socket.io")
