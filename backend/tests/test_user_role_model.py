from src.app.models.user_role import UserRole


def test_user_role_has_uuid_and_soft_delete_columns() -> None:
    columns = UserRole.__table__.c

    assert {"uuid", "updated_at", "deleted_at", "is_deleted"} <= set(columns.keys())
    assert columns["uuid"].unique is True
    assert columns["is_deleted"].index is True