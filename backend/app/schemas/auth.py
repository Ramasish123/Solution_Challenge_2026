from typing import Optional

from pydantic import BaseModel


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    full_name: str
    username: str


class UserProfile(BaseModel):
    id: int
    username: str
    email: str
    full_name: str
    role: str
    created_at: Optional[str] = None
    last_login_at: Optional[str] = None


class SignUpRequest(BaseModel):
    username: str
    email: str
    full_name: str
    password: str
    role: str
