from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.user import Token, UserCreate, UserLogin, UserOut
from app.services.auth_service import authenticate_user, get_current_user, issue_token, register_user
from app.models.user import User
from app.utils.rate_limit import check_rate_limit

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register(request: Request, payload: UserCreate, db: Session = Depends(get_db)):
    check_rate_limit(request, max_requests=5, window_seconds=60, key_prefix="register")
    user = register_user(db, payload)
    return Token(access_token=issue_token(user), user=user)


@router.post("/login", response_model=Token)
def login(request: Request, payload: UserLogin, db: Session = Depends(get_db)):
    check_rate_limit(request, max_requests=30, window_seconds=60, key_prefix="login")
    user = authenticate_user(db, payload.email, payload.password)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
    return Token(access_token=issue_token(user), user=user)


@router.get("/me", response_model=UserOut)
def me(current_user: User = Depends(get_current_user)):
    return current_user

