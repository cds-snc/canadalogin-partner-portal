from src.app.main import app


def test_openapi_documents_unified_error_schema_for_selected_endpoints() -> None:
    openapi_schema = app.openapi()

    error_response_schema_ref = {
        "$ref": "#/components/schemas/ErrorResponse"
    }

    user_me_responses = openapi_schema["paths"]["/api/v1/user/me/"]["get"]["responses"]
    assert user_me_responses["401"]["content"]["application/json"]["schema"] == error_response_schema_ref
    assert user_me_responses["422"]["content"]["application/json"]["schema"] == error_response_schema_ref

    workspace_list_responses = openapi_schema["paths"]["/api/v1/workspaces"]["get"]["responses"]
    assert workspace_list_responses["401"]["content"]["application/json"]["schema"] == error_response_schema_ref
    assert workspace_list_responses["403"]["content"]["application/json"]["schema"] == error_response_schema_ref

    workspace_create_responses = openapi_schema["paths"]["/api/v1/workspaces"]["post"]["responses"]
    assert workspace_create_responses["400"]["content"]["application/json"]["schema"] == error_response_schema_ref
    assert workspace_create_responses["404"]["content"]["application/json"]["schema"] == error_response_schema_ref
    assert workspace_create_responses["409"]["content"]["application/json"]["schema"] == error_response_schema_ref
    assert workspace_create_responses["422"]["content"]["application/json"]["schema"] == error_response_schema_ref

    workspace_detail_responses = openapi_schema["paths"]["/api/v1/workspaces/{workspace_uuid}"]["get"]["responses"]
    assert workspace_detail_responses["404"]["content"]["application/json"]["schema"] == error_response_schema_ref
    assert workspace_detail_responses["422"]["content"]["application/json"]["schema"] == error_response_schema_ref

    workspace_member_create_responses = openapi_schema["paths"]["/api/v1/workspaces/{workspace_uuid}/members"]["post"]["responses"]
    assert workspace_member_create_responses["400"]["content"]["application/json"]["schema"] == error_response_schema_ref
    assert workspace_member_create_responses["403"]["content"]["application/json"]["schema"] == error_response_schema_ref
    assert workspace_member_create_responses["409"]["content"]["application/json"]["schema"] == error_response_schema_ref

    create_ibm_application_responses = openapi_schema["paths"]["/api/v1/ibm-sv-admin/applications"]["post"]["responses"]
    assert create_ibm_application_responses["400"]["content"]["application/json"]["schema"] == error_response_schema_ref
    assert create_ibm_application_responses["401"]["content"]["application/json"]["schema"] == error_response_schema_ref
    assert create_ibm_application_responses["403"]["content"]["application/json"]["schema"] == error_response_schema_ref
    assert create_ibm_application_responses["422"]["content"]["application/json"]["schema"] == error_response_schema_ref

    assert openapi_schema["components"]["schemas"]["ErrorResponse"]["type"] == "object"


def test_openapi_documents_logout_response_contract() -> None:
    openapi_schema = app.openapi()

    logout_responses = openapi_schema["paths"]["/api/v1/logout"]["post"]["responses"]
    logout_schema = logout_responses["200"]["content"]["application/json"]["schema"]

    assert logout_schema == {"$ref": "#/components/schemas/LogoutResponse"}
    assert openapi_schema["components"]["schemas"]["LogoutResponse"]["type"] == "object"
