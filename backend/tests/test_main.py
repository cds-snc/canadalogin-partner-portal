import importlib
import sys
from unittest.mock import Mock, patch


def test_main_disables_create_tables_on_start() -> None:
    sys.modules.pop("src.app.main", None)

    with patch("src.app.core.setup.create_application", return_value=Mock()) as mock_create_application:
        importlib.import_module("src.app.main")

    assert mock_create_application.call_args.kwargs["create_tables_on_start"] is False
