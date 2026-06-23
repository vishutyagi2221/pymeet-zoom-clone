from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.user import Token, UserCreate, UserLogin, UserOut, UserUpdate, UserRegisterOTP, SendOTP
from app.services.auth_service import authenticate_user, get_current_user, issue_token, register_user, update_user
import time
import random
from app.models.user import User
from app.utils.rate_limit import check_rate_limit

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


MOCK_OTP_STORE: dict[str, dict] = {}

@router.post("/send-otp", status_code=status.HTTP_200_OK)
def send_otp(request: Request, payload: SendOTP):
    check_rate_limit(request, max_requests=5, window_seconds=60, key_prefix="send-otp")
    otp = str(random.randint(100000, 999999))
    email = payload.email.strip().lower()
    MOCK_OTP_STORE[email] = {"otp": otp, "expires_at": time.time() + 60}
    # In a real app, send email here. Since it's a mock, we return it in the response for testing.
    return {"message": "OTP sent successfully", "mock_otp": otp}

@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register(request: Request, payload: UserRegisterOTP, db: Session = Depends(get_db)):
    check_rate_limit(request, max_requests=5, window_seconds=60, key_prefix="register")
    
    email = payload.email.strip().lower()
    stored_otp_data = MOCK_OTP_STORE.get(email)
    
    if not stored_otp_data:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No OTP requested for this email")
    if time.time() > stored_otp_data["expires_at"]:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="OTP has expired")
    if stored_otp_data["otp"] != payload.otp:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid OTP")
        
    # Clear OTP after successful verification
    del MOCK_OTP_STORE[email]

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

@router.put("/me", response_model=UserOut)
def update_me(payload: UserUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return update_user(db, current_user, payload)

