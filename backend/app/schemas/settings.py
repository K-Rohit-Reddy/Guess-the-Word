from pydantic import BaseModel, field_validator


class UsernameCheckResponse(BaseModel):
    username: str
    available: bool


class UpdateProfileRequest(BaseModel):
    display_name: str | None = None
    username: str | None = None

    @field_validator("username")
    @classmethod
    def validate_username(cls, v: str | None) -> str | None:
        if v is None:
            return v
        if len(v) < 5:
            raise ValueError("Username must be at least 5 characters")
        if not v.isalnum():
            raise ValueError("Username must contain only letters and numbers")
        if v == v.lower() or v == v.upper():
            raise ValueError("Username must contain both upper and lowercase letters")
        return v

    @field_validator("display_name")
    @classmethod
    def validate_display_name(cls, v: str | None) -> str | None:
        if v is not None and len(v.strip()) == 0:
            raise ValueError("Display name cannot be empty")
        return v.strip() if v else v


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def validate_new_password(cls, v: str) -> str:
        import re
        if len(v) < 5:
            raise ValueError("Password must be at least 5 characters")
        if not re.search(r"[a-zA-Z]", v):
            raise ValueError("Password must contain at least one letter")
        if not re.search(r"[0-9]", v):
            raise ValueError("Password must contain at least one number")
        if not re.search(r"[$%*]", v):
            raise ValueError("Password must contain at least one special character ($, %, *)")
        return v
