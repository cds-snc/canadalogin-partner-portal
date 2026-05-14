from datetime import timedelta
from typing import Any

from jwt import PyJWTError
from sqlalchemy.ext.asyncio import AsyncSession
from starlette.requests import Request

from ..core.config import settings
from ..core.exceptions.http_exceptions import UnauthorizedException
from ..core.security import (
    ACCESS_TOKEN_EXPIRE_MINUTES,
    TokenType,
    authenticate_user,
    blacklist_tokens,
    create_access_token,
    create_refresh_token,
    verify_token,
    )


class AuthService:
    async def login(self, form_data: Any, db: AsyncSession) -> dict[str, Any]:
        if not settings.LOCAL_PASSWORD_LOGIN_ENABLED:
            raise UnauthorizedException("Local password login is disabled.")

        user = await authenticate_user(identifier=form_data.username, password=form_data.password, db=db)
        if not user:
            raise UnauthorizedException("Wrong credentials.")
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        subject = str(user["uuid"])
        access_token = await create_access_token(data={"sub": subject}, expires_delta=access_token_expires)
        refresh_token = await create_refresh_token(data={"sub": subject})
        max_age = settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "refresh_token": refresh_token,
            "max_age": max_age,
        }

    async def refresh_access_token(self, request: Request, db: AsyncSession) -> dict[str, str]:
        refresh_token = request.cookies.get("refresh_token")
        if not refresh_token:
            raise UnauthorizedException("Refresh token missing.")

        user_data = await verify_token(refresh_token, TokenType.REFRESH, db)
        if not user_data:
            raise UnauthorizedException("Invalid refresh token.")

        new_access_token = await create_access_token(data={"sub": user_data.subject})
        return {"access_token": new_access_token, "token_type": "bearer"}

    async def logout(
        self,
        request: Request,
        access_token: str | None,
        refresh_token: str | None,
        db: AsyncSession,
    ) -> dict[str, Any]:
        try:
            try:
                request.session.clear()
            except AssertionError:
                pass

            if access_token and refresh_token:
                await blacklist_tokens(access_token=access_token, refresh_token=refresh_token, db=db)
                return {"message": "Logged out successfully", "clear_cookies": True}

            if request.session == {}:
                return {"message": "Logged out successfully", "clear_cookies": True}

            raise UnauthorizedException("No authenticated session found.")
        except PyJWTError:
            raise UnauthorizedException("Invalid token.")
