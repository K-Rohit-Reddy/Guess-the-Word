import re
from datetime import datetime
from pydantic import BaseModel, field_validator


class UserRegister(BaseModel):
    display_name: str
    username: str
    password: str

    @field_validator("username")
    @classmethod
    def validate_username(cls, v: str) -> str:
        if len(v) < 5:
            raise ValueError("Username must be at least 5 characters")
        if not v.isalpha():
            raise ValueError("Username must contain only letters")
        if v == v.lower() or v == v.upper():
            raise ValueError("Username must contain both upper and lowercase letters")
        return v

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v) < 5:
            raise ValueError("Password must be at least 5 characters")
        if not re.search(r"[a-zA-Z]", v):
            raise ValueError("Password must contain at least one letter")
        if not re.search(r"[0-9]", v):
            raise ValueError("Password must contain at least one number")
        if not re.search(r"[$%*]", v):
            raise ValueError("Password must contain at least one special character ($, %, *)")
        return v

    @field_validator("display_name")
    @classmethod
    def validate_display_name(cls, v: str) -> str:
        if not v or len(v.strip()) == 0:
            raise ValueError("Display name is required")
        return v.strip()


class UserLogin(BaseModel):
    username: str
    password: str


class UserResponse(BaseModel):
    id: int
    display_name: str
    username: str
    role: str
    created_at: datetime | None = None

    model_config = {"from_attributes": True}


class LoginResponse(BaseModel):
    message: str
    user: UserResponse
