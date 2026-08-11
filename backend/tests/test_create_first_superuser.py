from unittest.mock import AsyncMock, Mock, patch

import pytest

from src.app.core.config import settings
from src.app.models.role import Role
from src.app.models.user import User
from src.scripts.create_first_superuser import create_first_user


def _scalar_result(value):
    result = Mock()
    result.scalar_one_or_none.return_value = value
    return result


class TestCreateFirstSuperuser:
    @pytest.mark.asyncio
    async def test_create_first_user_creates_admin_role_and_bootstrap_user(self, mock_db) -> None:
        created_objects: list[object] = []

        def add_object(value: object) -> None:
            created_objects.append(value)

        async def flush() -> None:
            for value in created_objects:
                if isinstance(value, Role) and value.id is None:
                    value.id = 7

        mock_db.execute = AsyncMock(side_effect=[_scalar_result(None), _scalar_result(None)])
        mock_db.add = Mock(side_effect=add_object)
        mock_db.flush = AsyncMock(side_effect=flush)
        mock_db.commit = AsyncMock()

        with patch.multiple(
            settings,
            SUPERUSER="Kevan.Adlard@CDS-SNC.ca ",
            CLPP_ADMIN_ROLE_NAME="admin",
        ):
            await create_first_user(mock_db)

        assert len(created_objects) == 2
        created_role = next(value for value in created_objects if isinstance(value, Role))
        created_user = next(value for value in created_objects if isinstance(value, User))

        assert created_role.name == "admin"
        assert created_user.email == "kevan.adlard@cds-snc.ca"
        assert created_user.username == "kevan.adlard@cds-snc.ca"
        assert created_user.is_superuser is True
        assert created_user.enabled is True
        assert created_user.role_ids == [7]
        mock_db.commit.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_create_first_user_updates_existing_user_with_admin_role(self, mock_db) -> None:
        existing_role = Role(name="admin", description="Administrator role mapped from OIDC admin group")
        existing_role.id = 3
        existing_user = User(
            name="Kevan",
            email="legacy@example.com",
            username="legacy@example.com",
            is_superuser=False,
            enabled=False,
            role_ids=[11],
        )
        existing_user.is_deleted = True

        mock_db.execute = AsyncMock(side_effect=[_scalar_result(existing_role), _scalar_result(existing_user)])
        mock_db.add = Mock()
        mock_db.flush = AsyncMock()
        mock_db.commit = AsyncMock()

        with patch.multiple(
            settings,
            SUPERUSER="kevan.adlard@cds-snc.ca",
            CLPP_ADMIN_ROLE_NAME="admin",
        ):
            await create_first_user(mock_db)

        mock_db.add.assert_not_called()
        mock_db.flush.assert_not_awaited()
        assert existing_user.name == "Kevan"
        assert existing_user.email == "kevan.adlard@cds-snc.ca"
        assert existing_user.username == "kevan.adlard@cds-snc.ca"
        assert existing_user.is_superuser is True
        assert existing_user.enabled is True
        assert existing_user.is_deleted is False
        assert existing_user.deleted_at is None
        assert existing_user.role_ids == [11, 3]
        mock_db.commit.assert_awaited_once()