from typing import Annotated

from fastapi import APIRouter, Depends, Request

from ...api.dependencies import get_current_user
from ...core.authorization import CANONICAL_ROLE_DEFINITIONS, CanonicalRoleCode
from ...core.exceptions.http_exceptions import NotFoundException
from ...schemas.role import CanonicalRoleReferenceRead

router = APIRouter(tags=["roles"])


@router.get("/roles", response_model=list[CanonicalRoleReferenceRead])
async def read_roles(
    request: Request,
    current_user: Annotated[dict | None, Depends(get_current_user)] = None,
) -> list[CanonicalRoleReferenceRead]:
    """Return the complete immutable product role reference."""

    return [CanonicalRoleReferenceRead(code=definition.code, scope=definition.scope) for definition in CANONICAL_ROLE_DEFINITIONS.values()]


@router.get("/role/{role_code}", response_model=CanonicalRoleReferenceRead)
async def read_role(
    request: Request,
    role_code: str,
    current_user: Annotated[dict | None, Depends(get_current_user)] = None,
) -> CanonicalRoleReferenceRead:
    try:
        canonical_role = CanonicalRoleCode(role_code)
        definition = CANONICAL_ROLE_DEFINITIONS[canonical_role]
    except (KeyError, ValueError) as exc:
        raise NotFoundException("Role not found") from exc

    return CanonicalRoleReferenceRead(code=definition.code, scope=definition.scope)
