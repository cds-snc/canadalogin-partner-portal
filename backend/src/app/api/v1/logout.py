import secrets
from typing import Literal
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

from fastapi import APIRouter, Depends, Request
from starlette.responses import RedirectResponse

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


def clear_session_cookie(response: RedirectResponse) -> None:
    response.delete_cookie(
        key=settings.SESSION_COOKIE_NAME,
        domain=settings.SESSION_COOKIE_DOMAIN or None,
        secure=settings.SESSION_COOKIE_SECURE,
        httponly=True,
        samesite=settings.SESSION_COOKIE_SAMESITE,
    )


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
    service: AuthService = Depends(get_auth_service),
    reason: LogoutReason | None = None,
) -> RedirectResponse:

    state = create_logout_state(reason) if reason else None
    result = await service.logout(request=request, state=state)

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
        if state:
            query_params["state"] = state

        if query_params:
            redirect_url = f"{end_session_endpoint}?{urlencode(query_params)}"
        else:
            redirect_url = end_session_endpoint

        response = RedirectResponse(url=redirect_url)
        #clear_session_cookie(response)
        request.session.clear()
        return response


    redirect_url = settings.OIDC_POST_LOGOUT_REDIRECT_URI
    if state:
        redirect_url = add_query_parameters(redirect_url, {"state": state})

    response = RedirectResponse(url=redirect_url)
    # Ensure the session cookie is cleared before redirecting
    #clear_session_cookie(response)
    request.session.clear()
    return response
