from pathlib import Path

from src.app.models.rp_application import RPApplication

MIGRATION_PATH = Path(__file__).parents[1] / "src" / "migrations" / "versions" / "0024_rp_registration_draft_metadata.py"


def test_registration_draft_migration_is_additive_and_backfills_only_version() -> None:
    source = MIGRATION_PATH.read_text(encoding="utf-8")

    assert 'down_revision: Union[str, None] = "0023_authorization_im"' in source
    assert '"registration_creation_key"' in source
    assert '"registration_draft_version"' in source
    assert '"registration_last_completed_step"' in source
    assert "SET registration_draft_version = 0" in source
    assert "SET registration_creation_key" not in source
    assert "SET registration_last_completed_step" not in source
    assert "registration_draft_version >= 0" in source
    assert "'basics', 'endpoints', 'client-and-access', 'signing', 'encryption'" in source


def test_registration_draft_model_matches_constraints_and_partial_unique_index() -> None:
    table = RPApplication.__table__
    constraints = {constraint.name for constraint in table.constraints}
    indexes = {index.name: index for index in table.indexes}

    assert "ck_rp_application_registration_draft_version" in constraints
    assert "ck_rp_application_registration_last_completed_step" in constraints
    creation_key_index = indexes["uq_rp_application_registration_creation_key"]
    assert creation_key_index.unique is True
    assert str(creation_key_index.dialect_options["postgresql"]["where"]) == ("registration_creation_key IS NOT NULL")
