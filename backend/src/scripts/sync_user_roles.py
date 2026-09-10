import argparse
import asyncio
from pathlib import Path
from typing import Any

import yaml

from ..app.core.db.database import local_session
from ..app.repositories.crud_roles import crud_roles
from ..app.repositories.crud_users import crud_users
from ..app.repositories.crud_user_roles import crud_user_roles
from ..app.schemas.role import RoleRead
from ..app.schemas.user import UserCreateInternal, UserReadInternal
from ..app.schemas.user_role import UserRoleCreateInternal

ROLE_NAMES = {
    "Partner Developer",
    "Partner Production Administrator",
    "CanadaLogin Administrators",
}


def load_assignments(path: Path) -> dict[str, list[str]]:
    with path.open(encoding="utf-8") as file:
        document = yaml.safe_load(file)

    if not isinstance(document, dict) or set(document) - ROLE_NAMES:
        raise ValueError("The YAML file must contain only supported role names.")

    assignments: dict[str, list[str]] = {}
    for role_name, emails in document.items():
        if not isinstance(emails, list) or not all(isinstance(email, str) and email.strip() for email in emails):
            raise ValueError(f"{role_name} must contain a list of email addresses.")
        assignments[role_name] = [email.strip().lower() for email in emails]
    return assignments


async def sync_assignments(assignments: dict[str, list[str]]) -> tuple[int, int]:
    created_users = 0
    added_assignments = 0
    async with local_session() as session:
        async with session.begin():
            for role_name, emails in assignments.items():
                role = await crud_roles.get(
                    db=session,
                    name=role_name,
                    is_deleted=False,
                    schema_to_select=RoleRead,
                )
                if role is None:
                    raise ValueError(f"Role not found: {role_name}")

                for email in emails:
                    user = await crud_users.get(
                        db=session,
                        email=email,
                        is_deleted=False,
                        schema_to_select=UserReadInternal,
                    )
                    if user is None:
                        user = await crud_users.create(
                            db=session,
                            object=UserCreateInternal(name=email, email=email, username=email),
                            schema_to_select=UserReadInternal,
                        )
                        created_users += 1

                    if not await crud_user_roles.exists(db=session, user_id=user["id"], role_id=role["id"]):
                        await crud_user_roles.create(
                            db=session,
                            object=UserRoleCreateInternal(user_id=user["id"], role_id=role["id"]),
                        )
                        added_assignments += 1
    return created_users, added_assignments


def parse_arguments() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Create local users and add role memberships from YAML.")
    parser.add_argument("path", type=Path, help="Path to the role-centric YAML file")
    return parser.parse_args()


async def main() -> None:
    arguments = parse_arguments()
    assignments = load_assignments(arguments.path)
    created_users, added_assignments = await sync_assignments(assignments)
    print(f"Created users: {created_users}; added role assignments: {added_assignments}")


if __name__ == "__main__":
    asyncio.run(main())