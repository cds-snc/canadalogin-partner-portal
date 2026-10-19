import secrets
from typing import Literal
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

from fastapi import APIRouter, Depends, Request

from ...api.dependencies import get_auth_service
from ...core.config import settings
from ...schemas.auth import LogoutOidcResponse, LogoutResponse
from ...services.auth_service import AuthService

router = APIRouter(tags=["login"])

LogoutReason = Literal["manual", "session-expired"]


def create_logout_state(reason: LogoutReason) -> str:
    return f"{reason}.{secrets.token_urlsafe(24)}"


def add_query_parameters(url: str, parameters: dict[str, str]) -> str:
    parsed_url = urlsplit(url)
    query_parameters = dict(parse_qsl(parsed_url.query))
    query_parameters.update(parameters)
    return urlunsplit(
        (
            parsed_url.scheme,
            parsed_url.netloc,
            parsed_url.path,
            urlencode(query_parameters),
            parsed_url.fragment,
        )
    )


@router.post("/logout", response_model=LogoutResponse)
async def logout(
    request: Request,
    service: AuthService = Depends(get_auth_service),
    reason: LogoutReason | None = None,
) -> LogoutResponse:
    state = create_logout_state(reason) if reason else None
    result = await service.logout(request=request, state=state)

    oidc_logout = result.get("oidc_logout")
    redirect_state = oidc_logout.get("state") if oidc_logout and oidc_logout.get("state") else state
    payload = LogoutResponse(
        message=result["message"],
        redirect_url=build_logout_redirect_url(oidc_logout, redirect_state),
    )
    if oidc_logout:
        payload.oidc_logout = LogoutOidcResponse(
            end_session_endpoint=oidc_logout["end_session_endpoint"],
            id_token_hint=oidc_logout.get("id_token_hint"),
            post_logout_redirect_uri=oidc_logout.get("post_logout_redirect_uri"),
            state=oidc_logout.get("state"),
        )

    return payload


def build_logout_redirect_url(oidc_logout: dict | None, state: str | None) -> str:
    if oidc_logout:
        query_params: dict[str, str] = {}
        id_token_hint = oidc_logout.get("id_token_hint")
        post_logout_redirect_uri = oidc_logout.get("post_logout_redirect_uri")
        if id_token_hint:
            query_params["id_token_hint"] = id_token_hint
        if post_logout_redirect_uri:
            query_params["post_logout_redirect_uri"] = post_logout_redirect_uri
        if state:
            query_params["state"] = state
        return add_query_parameters(oidc_logout["end_session_endpoint"], query_params)

    redirect_url = settings.OIDC_POST_LOGOUT_REDIRECT_URI
    if state:
        return add_query_parameters(redirect_url, {"state": state})
    return redirect_url
