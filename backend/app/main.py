import socketio
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import Base, engine
from app.models import Meeting, MeetingParticipant, User  # noqa: F401
from app.routes import auth, meetings
from app.websocket.signaling import sio

Base.metadata.create_all(bind=engine)

ALLOWED_ORIGINS = ["*"]

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


@fastapi_app.get("/", tags=["System"])
@fastapi_app.head("/", tags=["System"])
def read_root():
    return {"message": "PyMeet Backend is running! Please visit the Vercel frontend URL to use the app.", "docs": "/docs"}


@fastapi_app.get("/api/health", tags=["System"])
@fastapi_app.head("/api/health", tags=["System"])
def health():
    return {"status": "ok", "service": settings.app_name}


app = socketio.ASGIApp(sio, other_asgi_app=fastapi_app, socketio_path="socket.io")
