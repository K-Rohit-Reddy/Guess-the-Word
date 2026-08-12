import os
import secrets
from datetime import datetime, timedelta, timezone

from fastapi import Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from passlib.context import CryptContext
from itsdangerous import URLSafeSerializer

from app.core.config import get_settings
from app.core.database import get_db

settings = get_settings()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
cookie_signer = URLSafeSerializer(settings.SECRET_KEY, salt="session")

SESSION_COOKIE_NAME = "session_id"


def hash_password(password: str) -> str:
    """Hash a password using bcrypt."""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain password against a bcrypt hash."""
    return pwd_context.verify(plain_password, hashed_password)


def generate_session_id() -> str:
    """Generate a cryptographically secure session ID."""
    return secrets.token_hex(32)


def sign_session_id(session_id: str) -> str:
    """Sign a session ID for tamper-proof cookie storage."""
    return cookie_signer.dumps(session_id)


def unsign_session_id(signed_value: str) -> str | None:
    """Unsign and verify a session cookie value. Returns None if invalid."""
    try:
        return cookie_signer.loads(signed_value)
    except Exception:
        return None


async def get_current_user(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """
    Dependency: extracts session_id from cookie, looks up session in DB,
    returns the associated User. Raises 401 if invalid or expired.
    """
    from app.models.session import Session as SessionModel
    from app.models.user import User

    signed_cookie = request.cookies.get(SESSION_COOKIE_NAME)
    if not signed_cookie:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )

    session_id = unsign_session_id(signed_cookie)
    if not session_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid session",
        )

    # Look up session in database
    result = await db.execute(
        select(SessionModel).where(SessionModel.id == session_id)
    )
    session = result.scalar_one_or_none()

    if not session:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session not found",
        )

    # Check expiry
    if session.expires_at < datetime.now(timezone.utc):
        await db.delete(session)
        await db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired",
        )

    # Get user
    result = await db.execute(
        select(User).where(User.id == session.user_id)
    )
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )

    return user


async def require_admin(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """Dependency: ensures the current user has admin role."""
    user = await get_current_user(request, db)
    if user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    return user
