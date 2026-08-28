from typing import Annotated

from fastapi import Depends, FastAPI

from src.app.api.dependencies import get_current_user
from src.app.core.config import settings


def test_openapi_advertises_only_the_supported_session_cookie_scheme() -> None:
    app = FastAPI()

    @app.get("/protected")
    async def protected(
        _current_user: Annotated[dict, Depends(get_current_user)],
    ) -> dict[str, bool]:
        return {"ok": True}

    schema = app.openapi()
    schemes = schema["components"]["securitySchemes"]

    assert schemes == {
        "SessionCookie": {
            "type": "apiKey",
            "description": ("Opaque server-side session cookie established by the OIDC flow."),
            "in": "cookie",
            "name": settings.SESSION_COOKIE_NAME,
        }
    }
    assert schema["paths"]["/protected"]["get"]["security"] == [{"SessionCookie": []}]
    assert all(scheme["type"] != "oauth2" for scheme in schemes.values())
