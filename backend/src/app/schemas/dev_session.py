"""Public-safe local developer session contracts."""

from typing import Literal
from uuid import UUID

from pydantic import Field

from ..core.authorization import GlobalRoleCode, PartnerRoleCode
from .authorization import AuthorizationContractModel


class DevSessionPartnerAccessRead(AuthorizationContractModel):
    workspace_uuid: UUID
    workspace_name: str
    role: PartnerRoleCode


class DevSessionFixtureRead(AuthorizationContractModel):
    fixture_id: str
    name: str
    # The reserved local.example identities are intentionally non-deliverable and
    # rejected by EmailStr's deliverability-oriented special-use check.
    email: str = Field(min_length=3, max_length=255)
    global_role: GlobalRoleCode | None = None
    partner_access: tuple[DevSessionPartnerAccessRead, ...] = ()


class DevSessionRead(AuthorizationContractModel):
    enabled: Literal[True] = True
    current_fixture_id: str | None = None
    fixtures: tuple[DevSessionFixtureRead, ...]


class DevSessionSelect(AuthorizationContractModel):
    fixture_id: str = Field(min_length=1, max_length=64)


__all__ = [
    "DevSessionFixtureRead",
    "DevSessionPartnerAccessRead",
    "DevSessionRead",
    "DevSessionSelect",
]
