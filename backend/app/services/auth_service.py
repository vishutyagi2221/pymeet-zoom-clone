from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.database import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate
from app.utils.security import create_access_token, decode_token, hash_password, verify_password

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

AVATAR_COLORS = ["#2563eb", "#7c3aed", "#db2777", "#0891b2", "#16a34a", "#ea580c"]


def get_user_by_email(db: Session, email: str) -> User | None:
    return db.query(User).filter(User.email == email.strip().lower()).first()


def register_user(db: Session, payload: UserCreate) -> User:
    if get_user_by_email(db, payload.email):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email is already registered")
    normalized_email = payload.email.strip().lower()
    color = AVATAR_COLORS[sum(ord(ch) for ch in normalized_email) % len(AVATAR_COLORS)]
    user = User(
        name=payload.name.strip(),
        email=normalized_email,
        hashed_password=hash_password(payload.password),
        avatar_color=color,
    )
    db.add(user)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email is already registered")
    db.refresh(user)
    return user


def authenticate_user(db: Session, email: str, password: str) -> User | None:
    user = get_user_by_email(db, email)
    if not user or not verify_password(password, user.hashed_password):
        return None
    return user


def update_user(db: Session, current_user: User, payload: UserUpdate) -> User:
    if payload.name:
        current_user.name = payload.name
        
    if payload.password:
        if not payload.current_password:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Current password is required to set a new password")
        if not verify_password(payload.current_password, current_user.hashed_password):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Incorrect current password")
            
        current_user.hashed_password = hash_password(payload.password)
        
    db.commit()
    db.refresh(current_user)
    return current_user


def issue_token(user: User) -> str:
    return create_access_token(subject=str(user.id), extra={"email": user.email})


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    credentials_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    payload = decode_token(token)
    if not payload or not payload.get("sub"):
        raise credentials_error
    user = db.get(User, int(payload["sub"]))
    if not user:
        raise credentials_error
    return user

