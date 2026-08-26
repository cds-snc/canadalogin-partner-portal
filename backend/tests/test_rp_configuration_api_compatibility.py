from src.app.main import app


def test_retained_backend_compatibility_methods_are_exhaustively_deprecated() -> None:
    schema = app.openapi()
    paths = schema["paths"]
    expected_deprecated_methods = {
        (
            "/api/v1/workspaces/{workspace_uuid}/application-information/"
            "{application_information_uuid}/rp-configurations/"
            "{source_rp_configuration_uuid}/progression"
        ): {"post"},
        "/api/v1/workspaces/{workspace_uuid}/applications": {"get", "post"},
        "/api/v1/workspaces/{workspace_uuid}/applications/{rp_application_uuid}": {
            "delete",
        },
        "/api/v1/workspaces/{workspace_uuid}/applications/{rp_application_uuid}/configuration": {"get"},
        "/api/v1/workspaces/{workspace_uuid}/applications/{rp_application_uuid}/registration-draft": {
            "get",
            "patch",
        },
        "/api/v1/workspaces/{workspace_uuid}/applications/{rp_application_uuid}/registration/complete": {"post"},
        "/api/v1/workspaces/{workspace_uuid}/applications/{rp_application_uuid}/production-review": {
            "get",
            "patch",
            "post",
        },
        "/api/v1/workspaces/{workspace_uuid}/applications/{rp_application_uuid}/developer-invitations": {
            "get",
            "post",
        },
        ("/api/v1/workspaces/{workspace_uuid}/applications/{rp_application_uuid}/developer-invitations/{invitation_uuid}/revoke"): {"post"},
        ("/api/v1/workspaces/{workspace_uuid}/applications/{rp_application_uuid}/developer-invitations/{invitation_uuid}/reissue"): {"post"},
        "/api/v1/workspaces/{workspace_uuid}/applications/{rp_application_uuid}/usage/summary": {"get"},
        "/api/v1/rp-applications/accessible/{rp_application_uuid}/oauth-setup": {"get"},
    }

    actual_deprecated_methods = {
        path: {method for method, operation in path_item.items() if isinstance(operation, dict) and operation.get("deprecated") is True}
        for path, path_item in paths.items()
        if any(isinstance(operation, dict) and operation.get("deprecated") is True for operation in path_item.values())
    }

    assert actual_deprecated_methods == expected_deprecated_methods

    legacy_record_path = "/api/v1/workspaces/{workspace_uuid}/applications/{rp_application_uuid}"
    assert "get" not in paths[legacy_record_path]
    assert "patch" not in paths[legacy_record_path]


def test_nested_rp_configuration_collection_keeps_non_colliding_meaning() -> None:
    schema = app.openapi()
    path = "/api/v1/workspaces/{workspace_uuid}/application-information/{application_information_uuid}/rp-configurations"

    assert set(schema["paths"][path]) >= {"get", "post"}
    assert schema["paths"][path]["get"].get("deprecated") is not True
    assert schema["paths"][path]["post"].get("deprecated") is not True


def test_accessible_summary_remains_and_record_department_adapter_is_retired() -> None:
    schema = app.openapi()
    paths = schema["paths"]

    assert "/api/v1/rp-applications/accessible" in paths
    department_path = "/api/v1/rp-applications/accessible/{rp_application_uuid}/department"
    assert department_path not in paths
