from src.app.main import app


def test_legacy_workspace_rp_methods_are_retained_and_deprecated() -> None:
    schema = app.openapi()
    paths = schema["paths"]
    legacy_methods = {
        "/api/v1/workspaces/{workspace_uuid}/applications": {"get", "post"},
        "/api/v1/workspaces/{workspace_uuid}/applications/{rp_application_uuid}": {
            "delete",
            "get",
            "patch",
        },
        "/api/v1/workspaces/{workspace_uuid}/applications/{rp_application_uuid}/configuration": {"get"},
        "/api/v1/workspaces/{workspace_uuid}/applications/{rp_application_uuid}/registration-draft": {
            "get",
            "patch",
        },
        "/api/v1/workspaces/{workspace_uuid}/applications/{rp_application_uuid}/usage/summary": {"get"},
    }

    for path, methods in legacy_methods.items():
        assert path in paths
        for method in methods:
            assert paths[path][method]["deprecated"] is True


def test_nested_rp_configuration_collection_keeps_non_colliding_meaning() -> None:
    schema = app.openapi()
    path = "/api/v1/workspaces/{workspace_uuid}/application-information/{application_information_uuid}/rp-configurations"

    assert set(schema["paths"][path]) >= {"get", "post"}
    assert schema["paths"][path]["get"].get("deprecated") is not True
    assert schema["paths"][path]["post"].get("deprecated") is not True


def test_accessible_summary_and_department_compatibility_remain_explicit() -> None:
    schema = app.openapi()
    paths = schema["paths"]

    assert "/api/v1/rp-applications/accessible" in paths
    department_path = "/api/v1/rp-applications/accessible/{rp_application_uuid}/department"
    assert paths[department_path]["get"]["deprecated"] is True
    assert paths[department_path]["patch"]["deprecated"] is True
