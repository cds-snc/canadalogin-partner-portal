from typing import Annotated
from urllib.parse import urlencode

from fastapi import APIRouter, Depends, Request
from starlette.responses import RedirectResponse

from ...api.dependencies import get_auth_service, get_current_user
from ...core.config import settings
from ...schemas.auth import LogoutOidcResponse, LogoutResponse
from ...services.auth_service import AuthService

router = APIRouter(tags=["login"])


@router.post("/logout", response_model=LogoutResponse)
async def logout(
    request: Request,
    service: AuthService = Depends(get_auth_service),
) -> LogoutResponse:

    result = await service.logout(request=request)

    payload = LogoutResponse(message=result["message"])
    oidc_logout = result.get("oidc_logout")
    if oidc_logout:
        payload.oidc_logout = LogoutOidcResponse(
            end_session_endpoint=oidc_logout["end_session_endpoint"],
            id_token_hint=oidc_logout.get("id_token_hint"),
            post_logout_redirect_uri=oidc_logout.get("post_logout_redirect_uri"),
        )

    return payload


@router.get("/logout", include_in_schema=False)
async def logout_get(
    request: Request,
    current_user: Annotated[dict, Depends(get_current_user)],
    service: AuthService = Depends(get_auth_service),
) -> RedirectResponse:

    result = await service.logout(request=request)

    oidc_logout = result.get("oidc_logout")
    if oidc_logout:
        end_session_endpoint = oidc_logout["end_session_endpoint"]
        id_token_hint = oidc_logout.get("id_token_hint")
        post_logout_redirect_uri = oidc_logout.get("post_logout_redirect_uri")

        query_params: dict[str, str] = {}
        if id_token_hint:
            query_params["id_token_hint"] = id_token_hint
        if post_logout_redirect_uri:
            query_params["post_logout_redirect_uri"] = post_logout_redirect_uri

        if query_params:
            redirect_url = f"{end_session_endpoint}?{urlencode(query_params)}"
        else:
            redirect_url = end_session_endpoint

        return RedirectResponse(url=redirect_url)

    return RedirectResponse(url=settings.OIDC_POST_LOGOUT_REDIRECT_URI)
