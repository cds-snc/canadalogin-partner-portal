"""Triple-gated deterministic local developer session adapter."""

from typing import Annotated

from fastapi import APIRouter, Depends, Request, Response, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from starsessions.session import get_session_handler

from ...core.config import (
    LOCAL_DEV_SESSION_ALLOWED_ORIGINS_STATE_KEY,
    LOCAL_DEV_SESSION_ENABLED_GATE,
    LOCAL_DEV_SESSION_FIXTURE_KEY,
    LOCAL_DEV_SESSION_GATE_STATE_KEY,
    normalize_local_origin,
)
from ...core.db.database import async_get_db
from ...core.exceptions.http_exceptions import BadRequestException, ForbiddenException, NotFoundException
from ...core.local_persona_fixtures import (
    LOCAL_PERSONA_AUTH_PROVIDER,
    LOCAL_PERSONA_FIXTURES,
    LocalPersonaFixture,
    get_local_persona_fixture,
)
from ...models.user import User
from ...schemas.dev_session import DevSessionFixtureRead, DevSessionRead, DevSessionSelect

router = APIRouter(prefix="/dev/session", tags=["local development"])


def _require_enabled(request: Request) -> None:
    gate = getattr(request.app.state, LOCAL_DEV_SESSION_GATE_STATE_KEY, None)
    if gate != LOCAL_DEV_SESSION_ENABLED_GATE:
        raise NotFoundException("Not found")


def _require_mutation_origin(request: Request) -> None:
    _require_enabled(request)
    origin = request.headers.get("origin")
    if origin is None:
        return

    try:
        normalized_origin = normalize_local_origin(origin)
    except ValueError as exc:
        raise ForbiddenException("Cross-origin local session mutation is not allowed") from exc

    allowed_origins = getattr(
        request.app.state,
        LOCAL_DEV_SESSION_ALLOWED_ORIGINS_STATE_KEY,
        (),
    )
    try:
        request_origin = normalize_local_origin(f"{request.url.scheme}://{request.url.netloc}")
    except ValueError:
        request_origin = None

    if normalized_origin != request_origin and normalized_origin not in allowed_origins:
        raise ForbiddenException("Cross-origin local session mutation is not allowed")


async def _find_seeded_user(
    db: AsyncSession,
    fixture: LocalPersonaFixture,
) -> User | None:
    result = await db.execute(
        select(User).where(
            User.uuid == fixture.user_uuid,
            User.email == fixture.email,
            User.auth_provider == LOCAL_PERSONA_AUTH_PROVIDER,
            User.auth_subject == fixture.fixture_id,
            User.enabled.is_(True),
            User.is_deleted.is_(False),
        )
    )
    return result.scalar_one_or_none()


def _fixture_reads() -> tuple[DevSessionFixtureRead, ...]:
    return tuple(DevSessionFixtureRead.model_validate(fixture.to_response()) for fixture in LOCAL_PERSONA_FIXTURES)


def _session_fixture(request: Request) -> LocalPersonaFixture | None:
    fixture_id = request.session.get(LOCAL_DEV_SESSION_FIXTURE_KEY)
    if not isinstance(fixture_id, str):
        return None
    fixture = get_local_persona_fixture(fixture_id)
    if fixture is None or request.session.get("user_uuid") != str(fixture.user_uuid):
        return None
    return fixture


@router.get(
    "",
    response_model=DevSessionRead,
    dependencies=[Depends(_require_enabled)],
)
async def read_dev_session(
    request: Request,
    db: Annotated[AsyncSession, Depends(async_get_db)],
) -> DevSessionRead:
    current_fixture = _session_fixture(request)
    if current_fixture is not None and await _find_seeded_user(db, current_fixture) is None:
        current_fixture = None

    return DevSessionRead(
        current_fixture_id=current_fixture.fixture_id if current_fixture else None,
        fixtures=_fixture_reads(),
    )


@router.post(
    "",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(_require_mutation_origin)],
)
async def write_dev_session(
    payload: DevSessionSelect,
    request: Request,
    db: Annotated[AsyncSession, Depends(async_get_db)],
) -> Response:
    fixture = get_local_persona_fixture(payload.fixture_id)
    if fixture is None:
        raise BadRequestException("Unknown local persona fixture")
    if await _find_seeded_user(db, fixture) is None:
        raise NotFoundException("Local persona fixture has not been seeded")

    handler = get_session_handler(request)
    await handler.destroy()
    handler.regenerate_id()
    request.session.clear()
    request.session["user_uuid"] = str(fixture.user_uuid)
    request.session[LOCAL_DEV_SESSION_FIXTURE_KEY] = fixture.fixture_id
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.delete(
    "",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(_require_mutation_origin)],
)
async def erase_dev_session(request: Request) -> Response:
    fixture = _session_fixture(request)
    request.session.pop(LOCAL_DEV_SESSION_FIXTURE_KEY, None)
    if fixture is not None:
        request.session.pop("user_uuid", None)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


__all__: list[str] = ["router"]
