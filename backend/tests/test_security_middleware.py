import pytest
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse, PlainTextResponse
from fastapi.testclient import TestClient
from src.app.middleware.client_cache_middleware import ClientCacheMiddleware
from src.app.middleware.cookie_origin_middleware import CookieOriginMiddleware


def _cache_app() -> FastAPI:
    app = FastAPI()

    @app.get("/api/v1/user/me/")
    async def user_me() -> JSONResponse:
        return JSONResponse(
            {"email": "protected@example.test"},
            headers={"Cache-Control": "public, max-age=3600"},
        )

    @app.get("/profile")
    async def profile() -> PlainTextResponse:
        return PlainTextResponse("protected profile")

    @app.get("/assets/app.css")
    async def public_asset() -> PlainTextResponse:
        return PlainTextResponse("body {}", media_type="text/css")

    @app.get("/assets/manifest.json")
    async def json_asset() -> JSONResponse:
        return JSONResponse({"name": "app"})

    app.add_middleware(
        ClientCacheMiddleware,
        max_age=120,
        public_path_prefixes=("/assets",),
    )
    return app


def test_api_response_cannot_opt_itself_into_public_caching() -> None:
    with TestClient(_cache_app()) as client:
        response = client.get("/api/v1/user/me/")

    assert response.headers["Cache-Control"] == "private, no-store"
    assert response.headers["Referrer-Policy"] == "no-referrer"


def test_authenticated_non_api_response_is_never_public() -> None:
    with TestClient(_cache_app()) as client:
        client.cookies.set("app_session", "session-id")
        response = client.get("/profile")

    assert response.headers["Cache-Control"] == "private, no-store"


def test_only_explicit_unauthenticated_non_json_assets_are_public() -> None:
    with TestClient(_cache_app()) as client:
        public_response = client.get("/assets/app.css")
        client.cookies.set("app_session", "session-id")
        authenticated_response = client.get("/assets/app.css")
        client.cookies.clear()
        json_response = client.get("/assets/manifest.json")

    assert public_response.headers["Cache-Control"] == "public, max-age=120"
    assert authenticated_response.headers["Cache-Control"] == "private, no-store"
    assert json_response.headers["Cache-Control"] == "private, no-store"


def _origin_app() -> FastAPI:
    app = FastAPI()

    @app.post("/api/v1/role-assignments")
    @app.patch("/api/v1/user/00000000-0000-0000-0000-000000000001")
    @app.delete("/api/v1/workspaces/00000000-0000-0000-0000-000000000001")
    async def state_change(request: Request) -> dict[str, str]:
        return {"method": request.method}

    app.add_middleware(
        CookieOriginMiddleware,
        allowed_origins=("http://localhost:3000", "http://127.0.0.1:3000"),
        session_cookie_name="app_session",
    )
    app.add_middleware(ClientCacheMiddleware)
    return app


@pytest.mark.parametrize(
    ("method", "path"),
    [
        ("POST", "/api/v1/role-assignments"),
        ("PATCH", "/api/v1/user/00000000-0000-0000-0000-000000000001"),
        ("DELETE", "/api/v1/workspaces/00000000-0000-0000-0000-000000000001"),
    ],
)
def test_cookie_authenticated_role_user_and_workspace_mutations_reject_foreign_origin(
    method: str,
    path: str,
) -> None:
    with TestClient(_origin_app()) as client:
        client.cookies.set("app_session", "session-id")
        response = client.request(
            method,
            path,
            headers={"Origin": "https://evil.example"},
        )

    assert response.status_code == 403
    assert response.json()["error"]["code"] == "forbidden"
    assert response.headers["Cache-Control"] == "private, no-store"


@pytest.mark.parametrize(
    "headers",
    [
        {"Origin": "http://localhost:3000"},
        {"Origin": "http://testserver"},
        {"Referer": "http://127.0.0.1:3000/users"},
        {},
    ],
)
def test_trusted_browser_and_headerless_local_cookie_mutations_remain_compatible(
    headers: dict[str, str],
) -> None:
    with TestClient(_origin_app()) as client:
        client.cookies.set("app_session", "session-id")
        response = client.post(
            "/api/v1/role-assignments",
            headers=headers,
        )

    assert response.status_code == 200


def test_cross_site_fetch_metadata_cannot_bypass_missing_origin() -> None:
    with TestClient(_origin_app()) as client:
        client.cookies.set("app_session", "session-id")
        response = client.post(
            "/api/v1/role-assignments",
            headers={"Sec-Fetch-Site": "cross-site"},
        )

    assert response.status_code == 403


def test_foreign_origin_without_session_cookie_is_not_treated_as_cookie_auth() -> None:
    with TestClient(_origin_app()) as client:
        response = client.post(
            "/api/v1/role-assignments",
            headers={"Origin": "https://evil.example"},
        )

    assert response.status_code == 200
