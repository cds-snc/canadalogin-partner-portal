from __future__ import annotations

import importlib.util
from pathlib import Path
from types import ModuleType
from typing import Any


MIGRATION_PATH = Path(__file__).resolve().parents[1] / "src" / "migrations" / "versions" / "0010_application_erd_tables.py"

EXPECTED_BILINGUAL_LOOKUPS = {
    "application_configuration_status": [
        ("draft", "Draft", "Brouillon"),
        ("submitted", "Submitted", "Soumis"),
        ("published", "Published", "Publié"),
    ],
    "tenant": [
        ("test", "Test", "Test"),
        ("staging", "Staging", "Préproduction"),
        ("production", "Production", "Production"),
    ],
    "application_configuration_client_type": [
        ("public", "Public", "Public"),
        ("confidential", "Confidential", "Confidentiel"),
    ],
    "client_auth_method": [
        ("private_key_jwt", "Private Key JWT", "JWT de clé privée"),
        ("client_secret_basic", "Client Secret (Basic)", "Secret client (Basic)"),
        ("client_secret_post", "Client Secret (POST)", "Secret client (POST)"),
    ],
    "authentication_protocol": [
        ("oidc", "OpenID Connect", "OpenID Connect"),
        ("saml", "SAML 2.0", "SAML 2.0"),
    ],
    "logout_method": [
        ("front_channel", "Front-Channel", "Canal frontal"),
        ("back_channel", "Back-Channel", "Canal arrière"),
    ],
}

CODE_ONLY_LOOKUPS = {
    "signing_algorithm": ["RS256", "RS384", "RS512", "PS256", "PS384", "PS512", "ES256", "ES384", "ES512"],
    "encryption_key_algorithm": ["RSA-OAEP", "RSA-OAEP-256"],
    "encryption_content_algorithm": ["A128GCM", "A192GCM", "A256GCM"],
}


class _ScalarResult:
    def __init__(self, values: list[str]) -> None:
        self.values = values

    def scalars(self) -> list[str]:
        return self.values


class _SeedBind:
    def __init__(self) -> None:
        self.rows: dict[str, list[dict[str, object]]] = {}

    def execute(self, statement: Any, parameters: object | None = None) -> _ScalarResult | None:
        if statement.is_select:
            table_name = statement.get_final_froms()[0].name
            return _ScalarResult([row["code"] for row in self.rows.get(table_name, []) if isinstance(row["code"], str)])

        if statement.is_insert:
            assert isinstance(parameters, list)
            table_name = statement.table.name
            self.rows.setdefault(table_name, []).extend(parameters)
            return None

        raise AssertionError(f"Unexpected statement: {statement}")


def _load_migration() -> ModuleType:
    spec = importlib.util.spec_from_file_location("application_erd_tables_migration", MIGRATION_PATH)
    assert spec is not None
    assert spec.loader is not None
    migration = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(migration)
    return migration


def test_application_erd_lookup_seed_rows_include_bilingual_labels(monkeypatch: Any) -> None:
    migration = _load_migration()
    bind = _SeedBind()
    monkeypatch.setattr(migration.op, "get_bind", lambda: bind)

    migration._seed_lookup_rows()
    first_run_rows = {table_name: list(rows) for table_name, rows in bind.rows.items()}
    migration._seed_lookup_rows()

    assert bind.rows == first_run_rows

    for table_name, expected_rows in EXPECTED_BILINGUAL_LOOKUPS.items():
        actual_rows = bind.rows[table_name]
        assert [row["code"] for row in actual_rows] == [code for code, _, _ in expected_rows]
        assert [row["display_order"] for row in actual_rows] == list(range(1, len(expected_rows) + 1))
        assert [(row["label_en"], row["label_fr"]) for row in actual_rows] == [
            (label_en, label_fr) for _, label_en, label_fr in expected_rows
        ]

    for table_name, expected_codes in CODE_ONLY_LOOKUPS.items():
        actual_rows = bind.rows[table_name]
        assert [row["code"] for row in actual_rows] == expected_codes
        assert [row["display_order"] for row in actual_rows] == list(range(1, len(expected_codes) + 1))
        assert all("label_en" not in row and "label_fr" not in row for row in actual_rows)
