from src.app.main import app

RETIRED_PATHS = (
    "/api/v1/audit-logs",
    "/api/v1/onboarding-oversight/reports",
    "/api/v1/onboarding-oversight/reports/export",
    "/api/v1/workspaces/{workspace_uuid}/reports",
    "/api/v1/workspaces/{workspace_uuid}/reports/export",
    (
        "/api/v1/workspaces/{workspace_uuid}/application-information/"
        "{application_information_uuid}/rp-configurations/{rp_configuration_uuid}/audit-events"
    ),
    (
        "/api/v1/workspaces/{workspace_uuid}/application-information/"
        "{application_information_uuid}/rp-configurations/{rp_configuration_uuid}/audit-events/search-after"
    ),
    "/api/v1/workspaces/{workspace_uuid}/applications/{rp_application_uuid}/audit-events",
    "/api/v1/workspaces/{workspace_uuid}/applications/{rp_application_uuid}/audit-events/search-after",
    "/api/v1/ibm-sv-admin/applications/{application_id}/audit-trail",
    "/api/v1/mau/report",
    ("/api/v1/workspaces/{workspace_uuid}/application-information/{application_information_uuid}/review"),
    ("/api/v1/workspaces/{workspace_uuid}/application-information/{application_information_uuid}/review/notes"),
    ("/api/v1/workspaces/{workspace_uuid}/application-information/{application_information_uuid}/review/checklist"),
)

RETAINED_MAU_PATHS = (
    "/api/v1/rp-applications/accessible/mau-report-destinations",
    "/api/v1/rp-applications/accessible/{rp_application_uuid}/mau-report",
)


def test_aggregate_report_and_generic_audit_routes_are_retired() -> None:
    paths = app.openapi()["paths"]

    assert all(path not in paths for path in RETIRED_PATHS)


def test_scoped_mau_routes_remain_available() -> None:
    paths = app.openapi()["paths"]

    assert all(path in paths for path in RETAINED_MAU_PATHS)
