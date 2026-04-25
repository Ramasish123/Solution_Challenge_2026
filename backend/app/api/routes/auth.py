from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm

from app.api.deps import get_current_user
from app.core.config import settings
from app.core.security import create_access_token
from app.schemas.auth import LoginResponse, SignUpRequest, UserProfile
from app.services.auth_store import AuthenticatedUser, auth_store


router = APIRouter(prefix="/auth", tags=["auth"])


def normalize_identifier(value: str) -> str:
    return value.strip().lower()


def validate_signup_payload(payload: SignUpRequest) -> tuple[str, str, str, str]:
    role = payload.role.strip().lower()
    if role not in {"teacher", "student", "admin"}:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Role must be teacher, student, or admin",
        )

    username = normalize_identifier(payload.username)
    email = normalize_identifier(payload.email)
    full_name = payload.full_name.strip()

    if len(username) < 4:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User ID must be at least 4 characters long",
        )
    if "@" not in email or "." not in email.split("@")[-1]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Enter a valid email address",
        )
    if len(full_name) < 3:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Full name must be at least 3 characters long",
        )
    if len(payload.password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 8 characters long",
        )

    return role, username, email, full_name


def create_login_response(user: dict) -> LoginResponse:
    access_token_expires = timedelta(minutes=settings.jwt_expire_minutes)
    token = create_access_token(
        subject=user["email"],
        expires_delta=access_token_expires,
    )
    return LoginResponse(
        access_token=token,
        role=user["role"],
        full_name=user["full_name"],
        username=user["username"],
    )


@router.post("/login", response_model=LoginResponse)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
) -> LoginResponse:
    identifier = normalize_identifier(form_data.username)
    user = auth_store.find_by_identifier(identifier)
    if not user or not auth_store.password_matches(form_data.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect sign in ID or password",
        )

    saved_user = auth_store.mark_login(user["username"]) or user
    return create_login_response(saved_user)


@router.post("/signup", response_model=LoginResponse, status_code=status.HTTP_201_CREATED)
def signup(payload: SignUpRequest) -> LoginResponse:
    role, username, email, full_name = validate_signup_payload(payload)

    existing_username = auth_store.find_by_username(username)
    if existing_username:
        if auth_store.password_matches(payload.password, existing_username["hashed_password"]):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="That account already exists. Please sign in instead of creating it again.",
            )
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="That user ID is already registered. Please choose another one or sign in.",
        )

    existing_email = auth_store.find_by_email(email)
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="That email is already registered. Please sign in or use a different email.",
        )

    user = auth_store.create_user(
        username=username,
        email=email,
        full_name=full_name,
        role=role,
        password=payload.password,
    )
    return create_login_response(user)


@router.get("/me", response_model=UserProfile)
def get_profile(current_user: AuthenticatedUser = Depends(get_current_user)) -> UserProfile:
    user = auth_store.find_by_email(current_user.email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Authenticated user could not be found",
        )
    return UserProfile(**auth_store.to_profile(user))
