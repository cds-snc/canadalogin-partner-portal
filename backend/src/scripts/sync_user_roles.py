import argparse
import asyncio
from dataclasses import dataclass
from datetime import UTC, datetime
from pathlib import Path
from typing import Any
from uuid import UUID

import yaml
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..app.core.db.database import local_session
from ..app.models.partner_group import PartnerGroup
from ..app.models.partner_group_role import PartnerGroupRole
from ..app.repositories.crud_roles import crud_roles
from ..app.repositories.crud_user_roles import crud_user_roles
from ..app.repositories.crud_users import crud_users
from ..app.schemas.role import RoleRead
from ..app.schemas.user import UserCreateInternal, UserReadInternal
from ..app.schemas.user_role import UserRoleCreateInternal

ROLE_NAMES = {
    "Partner Developer",
    "Partner Production Administrator",
    "CanadaLogin Administrators",
}
PARTNER_GROUP_ROLES_KEY = "partner_group_roles"


@dataclass(frozen=True)
class PartnerGroupRoleAssignment:
    partner_group_uuid: UUID
    role_name: str
    emails: tuple[str, ...]


@dataclass(frozen=True)
class RoleAssignments:
    global_roles: dict[str, list[str]]
    partner_group_roles: list[PartnerGroupRoleAssignment]


def load_assignments(path: Path) -> RoleAssignments:
    with path.open(encoding="utf-8") as file:
        document = yaml.safe_load(file)

    if not isinstance(document, dict) or set(document) - ROLE_NAMES - {PARTNER_GROUP_ROLES_KEY}:
        raise ValueError("The YAML file must contain only supported role names and partner_group_roles.")

    global_roles: dict[str, list[str]] = {}
    for role_name in ROLE_NAMES & set(document):
        emails = document[role_name]
        if not isinstance(emails, list) or not all(isinstance(email, str) and email.strip() for email in emails):
            raise ValueError(f"{role_name} must contain a list of email addresses.")
        global_roles[role_name] = [email.strip().lower() for email in emails]

    partner_group_roles = []
    scoped_assignments = document.get(PARTNER_GROUP_ROLES_KEY, [])
    if not isinstance(scoped_assignments, list):
        raise ValueError("partner_group_roles must contain a list of assignments.")

    for assignment in scoped_assignments:
        if not isinstance(assignment, dict) or set(assignment) != {
            "partner_group_uuid",
            "role_name",
            "emails",
        }:
            raise ValueError(
                "Each partner_group_roles entry must contain partner_group_uuid, role_name, and emails."
            )
        role_name = assignment["role_name"]
        emails = assignment["emails"]
        if role_name not in ROLE_NAMES:
            raise ValueError(f"Unsupported partner-group role: {role_name}")
        if not isinstance(emails, list) or not all(isinstance(email, str) and email.strip() for email in emails):
            raise ValueError(f"partner_group_roles emails for {role_name} must be a list of email addresses.")
        try:
            partner_group_uuid = UUID(str(assignment["partner_group_uuid"]))
        except (AttributeError, TypeError, ValueError) as error:
            raise ValueError("partner_group_uuid must be a valid UUID.") from error
        partner_group_roles.append(
            PartnerGroupRoleAssignment(
                partner_group_uuid=partner_group_uuid,
                role_name=role_name,
                emails=tuple(email.strip().lower() for email in emails),
            )
        )

    return RoleAssignments(
        global_roles=global_roles,
        partner_group_roles=partner_group_roles,
    )


async def _get_or_create_user(
    session: AsyncSession,
    email: str,
) -> tuple[dict[str, Any], bool]:
    user = await crud_users.get(
        db=session,
        email=email,
        is_deleted=False,
        schema_to_select=UserReadInternal,
    )
    if user is not None:
        return user, False

    user = await crud_users.create(
        db=session,
        object=UserCreateInternal(name=email, email=email, username=email),
        commit=False,
        schema_to_select=UserReadInternal,
    )
    return user, True


async def _upsert_partner_group_role(
    session: AsyncSession,
    partner_group_id: int,
    user_id: int,
    role_id: int,
) -> bool:
    membership = (
        await session.execute(
            select(PartnerGroupRole).where(
                PartnerGroupRole.partner_group_id == partner_group_id,
                PartnerGroupRole.user_id == user_id,
                PartnerGroupRole.role_id == role_id,
            )
        )
    ).scalar_one_or_none()
    if membership is None:
        session.add(
            PartnerGroupRole(
                partner_group_id=partner_group_id,
                user_id=user_id,
                role_id=role_id,
            )
        )
        return True

    if membership.is_deleted:
        membership.is_deleted = False
        membership.deleted_at = None
        membership.updated_at = datetime.now(UTC)
        return True

    return False


async def sync_assignments(assignments: RoleAssignments) -> tuple[int, int]:
    created_users = 0
    added_assignments = 0
    async with local_session() as session:
        async with session.begin():
            for role_name, emails in assignments.global_roles.items():
                role = await crud_roles.get(
                    db=session,
                    name=role_name,
                    is_deleted=False,
                    schema_to_select=RoleRead,
                )
                if role is None:
                    raise ValueError(f"Role not found: {role_name}")

                for email in emails:
                    user, user_created = await _get_or_create_user(session, email)
                    if user_created:
                        created_users += 1

                    if not await crud_user_roles.exists(db=session, user_id=user["id"], role_id=role["id"]):
                        await crud_user_roles.create(
                            db=session,
                            object=UserRoleCreateInternal(user_id=user["id"], role_id=role["id"]),
                            commit=False,
                        )
                        added_assignments += 1

            for assignment in assignments.partner_group_roles:
                role = await crud_roles.get(
                    db=session,
                    name=assignment.role_name,
                    is_deleted=False,
                    schema_to_select=RoleRead,
                )
                if role is None:
                    raise ValueError(f"Role not found: {assignment.role_name}")

                partner_group_id = (
                    await session.execute(
                        select(PartnerGroup.id).where(
                            PartnerGroup.uuid == assignment.partner_group_uuid,
                            PartnerGroup.is_deleted.is_(False),
                        )
                    )
                ).scalar_one_or_none()
                if partner_group_id is None:
                    raise ValueError(f"Partner group not found: {assignment.partner_group_uuid}")

                for email in assignment.emails:
                    user, user_created = await _get_or_create_user(session, email)
                    if user_created:
                        created_users += 1

                    if await _upsert_partner_group_role(
                        session,
                        partner_group_id=partner_group_id,
                        user_id=user["id"],
                        role_id=role["id"],
                    ):
                        added_assignments += 1
    return created_users, added_assignments


def parse_arguments() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Create users and sync role memberships from YAML.")
    parser.add_argument("path", type=Path, help="Path to the role assignment YAML file")
    return parser.parse_args()


async def main() -> None:
    arguments = parse_arguments()
    assignments = load_assignments(arguments.path)
    created_users, added_assignments = await sync_assignments(assignments)
    print(f"Created users: {created_users}; added role assignments: {added_assignments}")


if __name__ == "__main__":
    asyncio.run(main())
