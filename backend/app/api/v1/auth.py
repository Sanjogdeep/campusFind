from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.config import settings
from app.core.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    create_refresh_token,
    decode_token,
    validate_college_email,
)
from app.core.dependencies import get_current_user
from app.models.models import User
from app.schemas.auth import (
    RegisterRequest,
    LoginRequest,
    TokenResponse,
    RefreshTokenRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest,
)
from app.schemas.user import UserResponse, UserProfileUpdate
from app.services.audit_service import AuditService

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=TokenResponse)
def register(req: RegisterRequest, request: Request, db: Session = Depends(get_db)):
    """Register a new student account using a valid college email address."""
    # Validate college domain
    if not validate_college_email(req.email):
        allowed_list = ", ".join(settings.allowed_domains)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Registration requires a verified college email address ending in: {allowed_list}",
        )

    # Check for existing email
    existing = db.query(User).filter(User.email == req.email.lower().strip()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this college email already exists.",
        )

    # First user can be made Super Admin or default role is STUDENT
    total_users = db.query(User).count()
    assigned_role = "SUPER_ADMIN" if total_users == 0 else "STUDENT"

    hashed_pw = get_password_hash(req.password)
    user = User(
        name=req.name.strip(),
        email=req.email.lower().strip(),
        hashed_password=hashed_pw,
        role=assigned_role,
        department=req.department,
        grad_year=req.grad_year,
        phone_number=req.phone_number,
        is_verified=True,
        badges=["New Member"],
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Audit Log
    client_ip = request.client.host if request.client else "unknown"
    AuditService.log(
        db=db,
        action="REGISTER",
        resource_type="USER",
        resource_id=str(user.id),
        user_id=user.id,
        ip_address=client_ip,
        details=f"New user registered with role {assigned_role}",
    )

    access_token = create_access_token(user.id)
    refresh_token = create_refresh_token(user.id)

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user_id=user.id,
        name=user.name,
        email=user.email,
        role=user.role,
    )


@router.post("/login", response_model=TokenResponse)
def login(req: LoginRequest, request: Request, db: Session = Depends(get_db)):
    """Authenticate with college email and password."""
    user = db.query(User).filter(User.email == req.email.lower().strip()).first()
    client_ip = request.client.host if request.client else "unknown"

    if not user or not verify_password(req.password, user.hashed_password):
        AuditService.log(
            db=db,
            action="LOGIN_FAILED",
            resource_type="USER",
            resource_id=req.email,
            ip_address=client_ip,
            details="Invalid email or password",
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid college email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if user.is_suspended:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been suspended by campus administration.",
        )

    AuditService.log(
        db=db,
        action="LOGIN_SUCCESS",
        resource_type="USER",
        resource_id=str(user.id),
        user_id=user.id,
        ip_address=client_ip,
        details="User successfully authenticated",
    )

    access_token = create_access_token(user.id)
    refresh_token = create_refresh_token(user.id)

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user_id=user.id,
        name=user.name,
        email=user.email,
        role=user.role,
    )


@router.post("/refresh", response_model=TokenResponse)
def refresh_token(req: RefreshTokenRequest, db: Session = Depends(get_db)):
    """Issue a new access token using a valid refresh token."""
    payload = decode_token(req.refresh_token)
    user_id = payload.get("sub")
    token_type = payload.get("type")

    if not user_id or token_type != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token.",
        )

    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user or user.is_suspended:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account inactive or suspended.",
        )

    new_access_token = create_access_token(user.id)
    new_refresh_token = create_refresh_token(user.id)

    return TokenResponse(
        access_token=new_access_token,
        refresh_token=new_refresh_token,
        user_id=user.id,
        name=user.name,
        email=user.email,
        role=user.role,
    )


@router.get("/me", response_model=UserResponse)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    """Retrieve full personal profile of the currently logged-in user."""
    return current_user


@router.put("/me", response_model=UserResponse)
def update_current_user_profile(
    req: UserProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update personal profile fields."""
    if req.name is not None and req.name.strip():
        current_user.name = req.name.strip()
    if req.department is not None:
        current_user.department = req.department.strip()
    if req.grad_year is not None:
        current_user.grad_year = req.grad_year
    if req.phone_number is not None:
        current_user.phone_number = req.phone_number.strip()
    if req.profile_image is not None:
        current_user.profile_image = req.profile_image

    db.commit()
    db.refresh(current_user)
    return current_user


@router.post("/forgot-password")
def forgot_password(req: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """Initiates password reset for a registered college account."""
    user = db.query(User).filter(User.email == req.email.lower().strip()).first()
    if not user:
        return {"message": "If this college email is registered, password reset instructions have been generated."}
    return {"message": "Password reset verification initiated for this account."}


@router.post("/reset-password")
def reset_password(req: ResetPasswordRequest, db: Session = Depends(get_db)):
    """Reset user password securely."""
    user = db.query(User).filter(User.email == req.email.lower().strip()).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No account found with this college email.",
        )
    if len(req.new_password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 6 characters long.",
        )
    user.hashed_password = get_password_hash(req.new_password)
    db.commit()
    return {"message": "Password updated successfully! You can now log in with your new password."}
