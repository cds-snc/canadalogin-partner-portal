import importlib
import importlib.util
from pathlib import Path
import sys
from unittest.mock import patch


MODULE_PATH = (
    Path(__file__).resolve().parents[1]
    / "src"
    / "migrations"
    / "versions"
    / "0003_seed_superuser.py"
)
SRC_ROOT = Path(__file__).resolve().parents[1] / "src"
if str(SRC_ROOT) not in sys.path:
    sys.path.insert(0, str(SRC_ROOT))

MODULE_SPEC = importlib.util.spec_from_file_location("test_seed_superuser_module", MODULE_PATH)
assert MODULE_SPEC is not None
assert MODULE_SPEC.loader is not None
seed_superuser = importlib.util.module_from_spec(MODULE_SPEC)
MODULE_SPEC.loader.exec_module(seed_superuser)


def test_resolve_superuser_email_prefers_environment_variable() -> None:
    with (
        patch.dict("os.environ", {"SUPERUSER": "env-admin@example.com"}, clear=True),
        patch.object(seed_superuser.settings, "SUPERUSER", "config-admin@example.com", create=True),
    ):
        assert seed_superuser._resolve_superuser_email() == "env-admin@example.com"


def test_resolve_superuser_email_falls_back_to_settings_value() -> None:
    with (
        patch.dict("os.environ", {}, clear=True),
        patch.object(seed_superuser.settings, "SUPERUSER", "config-admin@example.com", create=True),
    ):
        assert seed_superuser._resolve_superuser_email() == "config-admin@example.com"


def test_normalize_username_from_email_removes_non_alphanumeric_characters() -> None:
    assert seed_superuser._normalize_username_from_email("yiwei.wang@example.com") == "yiweiwang"