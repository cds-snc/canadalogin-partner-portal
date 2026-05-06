def test_crud_users_is_importable_from_repositories() -> None:
    from src.app.repositories.crud_users import crud_users

    assert crud_users is not None
