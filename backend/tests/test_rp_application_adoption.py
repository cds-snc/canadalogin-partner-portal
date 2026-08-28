from datetime import UTC, datetime
from unittest.mock import AsyncMock, Mock
from uuid import UUID

import pytest
from fastapi.testclient import TestClient
from src.app.api.dependencies import (
    get_current_user,
    get_rp_application_adoption_metadata_provider,
    get_rp_application_service,
)
from src.app.core.authorization import CanonicalRoleCode
from src.app.core.db.database import async_get_db
from src.app.core.exceptions.cache_exceptions import MissingClientError
from src.app.core.exceptions.http_exceptions import (
    CustomException,
    ForbiddenException,
    NotFoundException,
    RPApplicationAdoptionConflictException,
)
from src.app.main import app
from src.app.models.audit_log import AuditLog
from src.app.schemas.rp_application_adoption import (
    RPApplicationAdoptionCandidatePreviewRead,
    RPApplicationAdoptionProviderMetadata,
    RPApplicationWorkspaceAdoptionRead,
    RPApplicationWorkspaceLinkWrite,
)
from src.app.services.authorization_service import (
    AUTHORIZATION_STATE_KEY,
    ResolvedAuthorizationState,
    ResolvedPartnerAccess,
)
from src.app.services.rp_application_adoption_metadata_provider import (
    UnavailableRPApplicationAdoptionMetadataProvider,
)
from src.app.services.rp_application_service import RPApplicationService

RP_APPLICATION_UUID = UUID("018f6f83-0000-0000-0000-000000000401")
WORKSPACE_UUID = UUID("018f6f83-0000-0000-0000-000000000402")
DEPARTMENT_UUID = UUID("018f6f83-0000-0000-0000-000000000404")
APPLICATION_INFORMATION_UUID = UUID("018f6f83-0000-0000-0000-000000000405")


def cl_admin_user() -> dict:
    return {
        "id": 1,
        "uuid": UUID("018f6f83-0000-0000-0000-000000000403"),
        AUTHORIZATION_STATE_KEY: ResolvedAuthorizationState(
            global_role=CanonicalRoleCode.CL_ADMIN,
        ),
    }


def partner_user() -> dict:
    return {
        "id": 2,
        "uuid": UUID("018f6f83-0000-0000-0000-000000000406"),
        AUTHORIZATION_STATE_KEY: ResolvedAuthorizationState(
            partner_access=(
                ResolvedPartnerAccess(
                    workspace_id=9,
                    workspace_uuid=WORKSPACE_UUID,
                    role=CanonicalRoleCode.RP_ADMIN,
                ),
            ),
        ),
    }


def candidate_row() -> dict:
    return {
        "id": 41,
        "uuid": RP_APPLICATION_UUID,
        "dnr_app_name": "Portal Name",
        "configuration_name": "Portal production",
        "partner_environment": "Partner production",
        "ibm_sv_application_id": "ibm-app-401",
        "status": "active",
        "oidc_registration_payload": {
            "application_environment_url_en": "https://portal.example/callback-base",
            "redirect_uris": [],
            "pkce_supported": False,
            "client_type": "public",
        },
        "updated_at": datetime(2026, 8, 12, 12, 0, tzinfo=UTC),
    }


def link_candidate_row(**overrides: object) -> dict:
    row = {
        **candidate_row(),
        "workspace_id": None,
        "department_id": None,
        "application_information_id": None,
        "canada_login_environment": None,
    }
    row.update(overrides)
    return row


def database_result(*, rows: list[dict] | None = None, row: dict | None = None) -> Mock:
    mappings = Mock()
    mappings.all.return_value = rows or []
    mappings.one_or_none.return_value = row
    result = Mock()
    result.mappings.return_value = mappings
    return result


def scalar_database_result(value: object) -> Mock:
    result = Mock()
    result.scalar_one_or_none.return_value = value
    return result


def update_database_result(rowcount: int) -> Mock:
    result = Mock()
    result.rowcount = rowcount
    return result


def safe_provider() -> Mock:
    provider = Mock()
    provider.get_registration_metadata = AsyncMock(
        return_value=RPApplicationAdoptionProviderMetadata(
            display_name="IBM Portal Name",
            application_state=True,
            application_url="https://portal.example/callback-base",
            redirect_uris=["https://portal.example/callback"],
            logout_redirect_uris=["https://portal.example/logout-complete"],
            pkce_enabled=True,
            client_type="public",
            client_auth_method="private_key_jwt",
        )
    )
    return provider


class TestRPApplicationAdoptionService:
    def test_untrusted_correlation_identifier_is_reduced_to_safe_pseudonym(
        self,
    ) -> None:
        service = RPApplicationService()

        normalized = service._safe_adoption_correlation_id("secret value\nforged-log-line")

        assert normalized.startswith("hmac-sha256:")
        assert "secret value" not in normalized
        assert "\n" not in normalized

    @pytest.mark.asyncio
    async def test_candidate_list_is_local_only_and_returns_safe_camel_case_projection(
        self,
    ) -> None:
        service = RPApplicationService()
        db = Mock()
        db.execute = AsyncMock(
            return_value=database_result(rows=[candidate_row()]),
        )

        result = await service.list_rp_application_adoption_candidates(
            db=db,
            current_user=cl_admin_user(),
        )

        assert result == {
            "items": [
                {
                    "rpApplicationUuid": str(RP_APPLICATION_UUID),
                    "name": "Portal Name",
                    "configurationName": "Portal production",
                    "partnerEnvironment": "Partner production",
                    "ibmApplicationId": "ibm-app-401",
                    "metadataCompleteness": "incomplete",
                    "missingFieldNames": [
                        "redirectUris",
                        "logoutUri",
                        "logoutRedirectUris",
                        "clientAuthMethod",
                    ],
                    "updatedAt": "2026-08-12T12:00:00Z",
                }
            ]
        }
        statement = db.execute.await_args.args[0]
        statement_text = str(statement)
        assert "rp_application.workspace_id IS NULL" in statement_text
        assert "rp_application.is_deleted IS false" in statement_text
        assert "rp_application.deleted_at IS NULL" in statement_text
        assert "rp_application.ibm_sv_application_id IS NOT NULL" in statement_text

    @pytest.mark.asyncio
    async def test_partner_role_is_denied_before_candidate_query(self) -> None:
        service = RPApplicationService()
        db = Mock()
        db.execute = AsyncMock()

        with pytest.raises(ForbiddenException):
            await service.list_rp_application_adoption_candidates(
                db=db,
                current_user=partner_user(),
            )

        db.execute.assert_not_awaited()

    @pytest.mark.asyncio
    async def test_preview_compares_only_allowlisted_safe_fields(self) -> None:
        service = RPApplicationService()
        db = Mock()
        db.execute = AsyncMock(
            return_value=database_result(row=candidate_row()),
        )
        provider = Mock()
        provider.get_registration_metadata = AsyncMock(
            return_value=RPApplicationAdoptionProviderMetadata(
                display_name="IBM Portal Name",
                application_state=True,
                application_url="https://portal.example/callback-base",
                redirect_uris=["https://portal.example/callback"],
                logout_redirect_uris=["https://portal.example/logout-complete"],
                pkce_enabled=True,
                client_type="public",
                client_auth_method="private_key_jwt",
            )
        )

        result = await service.preview_rp_application_adoption_candidate(
            db=db,
            current_user=cl_admin_user(),
            rp_application_uuid=RP_APPLICATION_UUID,
            metadata_provider=provider,
        )

        preview = RPApplicationAdoptionCandidatePreviewRead.model_validate(result)
        assert preview.fillable_field_names == [
            "redirectUris",
            "logoutRedirectUris",
            "clientAuthMethod",
        ]
        assert preview.preserved_local_field_names == [
            "providerApplicationState",
            "applicationUrl",
            "clientType",
        ]
        assert preview.conflicting_field_names == ["displayName", "pkceEnabled"]
        assert next(field for field in preview.fields if field.field_name == "logoutUri").status == "missing"
        provider.get_registration_metadata.assert_awaited_once_with("ibm-app-401")

    @pytest.mark.asyncio
    async def test_partner_preview_is_denied_before_database_or_provider(self) -> None:
        service = RPApplicationService()
        db = Mock()
        db.execute = AsyncMock()
        provider = Mock()
        provider.get_registration_metadata = AsyncMock()

        with pytest.raises(ForbiddenException):
            await service.preview_rp_application_adoption_candidate(
                db=db,
                current_user=partner_user(),
                rp_application_uuid=RP_APPLICATION_UUID,
                metadata_provider=provider,
            )

        db.execute.assert_not_awaited()
        provider.get_registration_metadata.assert_not_awaited()

    @pytest.mark.asyncio
    async def test_non_candidate_returns_not_found_before_provider(self) -> None:
        service = RPApplicationService()
        db = Mock()
        db.execute = AsyncMock(return_value=database_result(row=None))
        provider = Mock()
        provider.get_registration_metadata = AsyncMock()

        with pytest.raises(NotFoundException):
            await service.preview_rp_application_adoption_candidate(
                db=db,
                current_user=cl_admin_user(),
                rp_application_uuid=RP_APPLICATION_UUID,
                metadata_provider=provider,
            )

        provider.get_registration_metadata.assert_not_awaited()

    @pytest.mark.asyncio
    @pytest.mark.parametrize(
        "provider_result",
        [
            {"displayName": "Safe", "clientSecret": "must-not-escape"},
            {"displayName": "Safe", "owners": [{"email": "owner@example"}]},
            {"displayName": "Safe", "rawPayload": {"secret": "must-not-escape"}},
        ],
    )
    async def test_secret_owner_or_raw_provider_fields_fail_safely(
        self,
        provider_result: dict,
    ) -> None:
        service = RPApplicationService()
        db = Mock()
        db.execute = AsyncMock(return_value=database_result(row=candidate_row()))
        provider = Mock()
        provider.get_registration_metadata = AsyncMock(return_value=provider_result)

        with pytest.raises(CustomException) as exc_info:
            await service.preview_rp_application_adoption_candidate(
                db=db,
                current_user=cl_admin_user(),
                rp_application_uuid=RP_APPLICATION_UUID,
                metadata_provider=provider,
            )

        assert exc_info.value.status_code == 503
        assert exc_info.value.detail == "RP adoption metadata provider is unavailable"
        assert "must-not-escape" not in str(exc_info.value)
        assert "owner@example" not in str(exc_info.value)

    @pytest.mark.asyncio
    async def test_provider_not_found_or_malformed_error_becomes_safe_unavailable(
        self,
    ) -> None:
        service = RPApplicationService()
        db = Mock()
        db.execute = AsyncMock(return_value=database_result(row=candidate_row()))
        provider = Mock()
        provider.get_registration_metadata = AsyncMock(
            side_effect=RuntimeError("unsafe upstream response body"),
        )

        with pytest.raises(CustomException) as exc_info:
            await service.preview_rp_application_adoption_candidate(
                db=db,
                current_user=cl_admin_user(),
                rp_application_uuid=RP_APPLICATION_UUID,
                metadata_provider=provider,
            )

        assert exc_info.value.status_code == 503
        assert "unsafe upstream response body" not in str(exc_info.value)

    @pytest.mark.asyncio
    async def test_unconfigured_real_provider_fails_closed(self) -> None:
        service = RPApplicationService()
        db = Mock()
        db.execute = AsyncMock(return_value=database_result(row=candidate_row()))

        with pytest.raises(MissingClientError):
            await service.preview_rp_application_adoption_candidate(
                db=db,
                current_user=cl_admin_user(),
                rp_application_uuid=RP_APPLICATION_UUID,
                metadata_provider=UnavailableRPApplicationAdoptionMetadataProvider(),
            )

    @pytest.mark.asyncio
    async def test_atomic_link_preserves_local_values_and_commits_safe_audit(
        self,
    ) -> None:
        service = RPApplicationService()
        db = Mock()
        db.execute = AsyncMock(
            side_effect=[
                database_result(row=link_candidate_row()),
                database_result(row={"id": 72, "uuid": WORKSPACE_UUID, "department_id": 81}),
                scalar_database_result(DEPARTMENT_UUID),
                database_result(row={"id": 91, "uuid": APPLICATION_INFORMATION_UUID}),
                update_database_result(1),
            ]
        )
        db.commit = AsyncMock()
        db.rollback = AsyncMock()
        db.add = Mock()
        provider = safe_provider()

        result = await service.link_rp_application_to_workspace(
            db=db,
            current_user=cl_admin_user(),
            rp_application_uuid=RP_APPLICATION_UUID,
            payload=RPApplicationWorkspaceLinkWrite(
                workspace_uuid=WORKSPACE_UUID,
                application_information_uuid=APPLICATION_INFORMATION_UUID,
                canada_login_environment="production",
            ),
            metadata_provider=provider,
            correlation_id="request-401",
        )

        adopted = RPApplicationWorkspaceAdoptionRead.model_validate(result)
        assert adopted.workspace_uuid == WORKSPACE_UUID
        assert adopted.department_uuid == DEPARTMENT_UUID
        assert adopted.application_information_uuid == APPLICATION_INFORMATION_UUID
        assert adopted.name == "Portal Name"
        assert adopted.configuration_name == "Portal production"
        assert adopted.partner_environment == "Partner production"
        assert adopted.filled_field_names == [
            "redirectUris",
            "logoutRedirectUris",
            "clientAuthMethod",
        ]
        assert adopted.conflicting_field_names == ["displayName", "pkceEnabled"]
        update_statement = db.execute.await_args_list[-1].args[0]
        update_parameters = update_statement.compile().params
        assert update_parameters["workspace_id"] == 72
        assert update_parameters["department_id"] == 81
        assert update_parameters["application_information_id"] == 91
        assert update_parameters["canada_login_environment"] == "production"
        assert "dnr_app_name" not in update_parameters
        assert update_parameters["oidc_registration_payload"]["pkce_supported"] is False
        assert update_parameters["oidc_registration_payload"]["redirect_uris"] == ["https://portal.example/callback"]
        audit = db.add.call_args.args[0]
        assert isinstance(audit, AuditLog)
        assert audit.target_uuid == RP_APPLICATION_UUID
        assert str(WORKSPACE_UUID) in audit.description
        assert str(APPLICATION_INFORMATION_UUID) in audit.description
        assert '"configurationName":"Portal production"' in audit.description
        assert "request-401" in audit.description
        assert "ibm-app-401" not in audit.description
        assert "Partner production" not in audit.description
        assert "portal.example" not in audit.description
        assert db.commit.await_count == 2
        db.rollback.assert_not_awaited()

    @pytest.mark.asyncio
    async def test_same_workspace_retry_returns_without_provider_or_duplicate_audit(
        self,
    ) -> None:
        service = RPApplicationService()
        db = Mock()
        db.execute = AsyncMock(
            side_effect=[
                database_result(
                    row=link_candidate_row(
                        workspace_id=72,
                        department_id=81,
                        application_information_id=91,
                        canada_login_environment="production",
                    )
                ),
                database_result(row={"id": 72, "uuid": WORKSPACE_UUID, "department_id": 81}),
                scalar_database_result(DEPARTMENT_UUID),
                database_result(row={"id": 91, "uuid": APPLICATION_INFORMATION_UUID}),
            ]
        )
        db.commit = AsyncMock()
        db.rollback = AsyncMock()
        db.add = Mock()
        provider = safe_provider()

        result = await service.link_rp_application_to_workspace(
            db=db,
            current_user=cl_admin_user(),
            rp_application_uuid=RP_APPLICATION_UUID,
            payload=RPApplicationWorkspaceLinkWrite(
                workspace_uuid=WORKSPACE_UUID,
                application_information_uuid=APPLICATION_INFORMATION_UUID,
            ),
            metadata_provider=provider,
            correlation_id="request-retry",
        )

        assert result["idempotentReplay"] is True
        provider.get_registration_metadata.assert_not_awaited()
        assert db.add.call_count == 1
        decision_audit = db.add.call_args.args[0]
        assert isinstance(decision_audit, AuditLog)
        assert decision_audit.target == "authorization_decision"
        assert db.commit.await_count == 2
        db.rollback.assert_not_awaited()

    @pytest.mark.asyncio
    async def test_different_workspace_is_stable_conflict_before_provider(self) -> None:
        service = RPApplicationService()
        db = Mock()
        db.execute = AsyncMock(
            side_effect=[
                database_result(
                    row=link_candidate_row(
                        workspace_id=999,
                        canada_login_environment="production",
                    )
                ),
                database_result(row={"id": 72, "uuid": WORKSPACE_UUID, "department_id": 81}),
            ]
        )
        db.commit = AsyncMock()
        db.rollback = AsyncMock()
        db.add = Mock()
        provider = safe_provider()

        with pytest.raises(RPApplicationAdoptionConflictException) as exc_info:
            await service.link_rp_application_to_workspace(
                db=db,
                current_user=cl_admin_user(),
                rp_application_uuid=RP_APPLICATION_UUID,
                payload=RPApplicationWorkspaceLinkWrite(
                    workspace_uuid=WORKSPACE_UUID,
                    application_information_uuid=APPLICATION_INFORMATION_UUID,
                ),
                metadata_provider=provider,
                correlation_id="request-conflict",
            )

        assert exc_info.value.code == "rp_application_already_linked"
        provider.get_registration_metadata.assert_not_awaited()
        assert db.add.call_count == 2
        assert db.commit.await_count == 2
        db.rollback.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_conditional_update_detects_concurrent_link_and_rolls_back(
        self,
    ) -> None:
        service = RPApplicationService()
        db = Mock()
        db.execute = AsyncMock(
            side_effect=[
                database_result(row=link_candidate_row()),
                database_result(row={"id": 72, "uuid": WORKSPACE_UUID, "department_id": 81}),
                scalar_database_result(DEPARTMENT_UUID),
                database_result(row={"id": 91, "uuid": APPLICATION_INFORMATION_UUID}),
                update_database_result(0),
            ]
        )
        db.commit = AsyncMock()
        db.rollback = AsyncMock()
        db.add = Mock()
        provider = safe_provider()

        with pytest.raises(RPApplicationAdoptionConflictException):
            await service.link_rp_application_to_workspace(
                db=db,
                current_user=cl_admin_user(),
                rp_application_uuid=RP_APPLICATION_UUID,
                payload=RPApplicationWorkspaceLinkWrite(
                    workspace_uuid=WORKSPACE_UUID,
                    application_information_uuid=APPLICATION_INFORMATION_UUID,
                    canada_login_environment="test",
                ),
                metadata_provider=provider,
                correlation_id="request-race",
            )

        assert db.add.call_count == 2
        assert db.commit.await_count == 2
        db.rollback.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_link_authorization_denies_before_database_and_provider(self) -> None:
        service = RPApplicationService()
        db = Mock()
        db.execute = AsyncMock()
        db.commit = AsyncMock()
        db.rollback = AsyncMock()
        db.add = Mock()
        provider = safe_provider()

        with pytest.raises(ForbiddenException):
            await service.link_rp_application_to_workspace(
                db=db,
                current_user=partner_user(),
                rp_application_uuid=RP_APPLICATION_UUID,
                payload=RPApplicationWorkspaceLinkWrite(
                    workspace_uuid=WORKSPACE_UUID,
                    application_information_uuid=APPLICATION_INFORMATION_UUID,
                ),
                metadata_provider=provider,
                correlation_id="request-denied",
            )

        db.execute.assert_not_awaited()
        db.rollback.assert_not_awaited()
        db.commit.assert_awaited_once()
        assert db.add.call_count == 1
        denied_audit = db.add.call_args.args[0]
        assert '"result":"denied"' in denied_audit.description
        provider.get_registration_metadata.assert_not_awaited()

    @pytest.mark.asyncio
    async def test_allowed_link_fails_closed_when_decision_audit_cannot_commit(
        self,
    ) -> None:
        service = RPApplicationService()
        db = Mock()
        db.execute = AsyncMock()
        db.commit = AsyncMock(side_effect=RuntimeError("audit store unavailable"))
        db.rollback = AsyncMock()
        db.add = Mock()
        provider = safe_provider()

        with pytest.raises(CustomException) as exc_info:
            await service.link_rp_application_to_workspace(
                db=db,
                current_user=cl_admin_user(),
                rp_application_uuid=RP_APPLICATION_UUID,
                payload=RPApplicationWorkspaceLinkWrite(
                    workspace_uuid=WORKSPACE_UUID,
                    application_information_uuid=APPLICATION_INFORMATION_UUID,
                ),
                metadata_provider=provider,
                correlation_id="request-audit-failed",
            )

        assert exc_info.value.status_code == 503
        db.execute.assert_not_awaited()
        assert db.add.call_count == 2
        assert db.commit.await_count == 2
        assert db.rollback.await_count == 2
        provider.get_registration_metadata.assert_not_awaited()

    @pytest.mark.asyncio
    async def test_denied_link_remains_denied_when_decision_audit_is_unavailable(
        self,
    ) -> None:
        service = RPApplicationService()
        db = Mock()
        db.execute = AsyncMock()
        db.commit = AsyncMock(side_effect=RuntimeError("audit store unavailable"))
        db.rollback = AsyncMock()
        db.add = Mock()
        provider = safe_provider()

        with pytest.raises(ForbiddenException):
            await service.link_rp_application_to_workspace(
                db=db,
                current_user=partner_user(),
                rp_application_uuid=RP_APPLICATION_UUID,
                payload=RPApplicationWorkspaceLinkWrite(
                    workspace_uuid=WORKSPACE_UUID,
                    application_information_uuid=APPLICATION_INFORMATION_UUID,
                ),
                metadata_provider=provider,
                correlation_id="request-denied-audit-failed",
            )

        db.execute.assert_not_awaited()
        assert db.add.call_count == 2
        assert db.commit.await_count == 2
        assert db.rollback.await_count == 2
        provider.get_registration_metadata.assert_not_awaited()

    @pytest.mark.asyncio
    async def test_provider_failure_leaves_candidate_unmodified(self) -> None:
        service = RPApplicationService()
        db = Mock()
        db.execute = AsyncMock(
            side_effect=[
                database_result(row=link_candidate_row()),
                database_result(row={"id": 72, "uuid": WORKSPACE_UUID, "department_id": 81}),
                scalar_database_result(DEPARTMENT_UUID),
                database_result(row={"id": 91, "uuid": APPLICATION_INFORMATION_UUID}),
            ]
        )
        db.commit = AsyncMock()
        db.rollback = AsyncMock()
        db.add = Mock()
        provider = Mock()
        provider.get_registration_metadata = AsyncMock(
            side_effect=RuntimeError("unsafe provider response"),
        )

        with pytest.raises(CustomException) as exc_info:
            await service.link_rp_application_to_workspace(
                db=db,
                current_user=cl_admin_user(),
                rp_application_uuid=RP_APPLICATION_UUID,
                payload=RPApplicationWorkspaceLinkWrite(
                    workspace_uuid=WORKSPACE_UUID,
                    application_information_uuid=APPLICATION_INFORMATION_UUID,
                    canada_login_environment="staging",
                ),
                metadata_provider=provider,
                correlation_id="request-provider-failed",
            )

        assert exc_info.value.status_code == 503
        assert db.execute.await_count == 4
        assert db.add.call_count == 2
        failure_audit = db.add.call_args.args[0]
        assert '"result":"failed"' in failure_audit.description
        assert "unsafe provider response" not in failure_audit.description
        assert "ibm-app-401" not in failure_audit.description
        assert db.commit.await_count == 2
        db.rollback.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_original_failure_is_preserved_when_failure_audit_is_unavailable(
        self,
    ) -> None:
        service = RPApplicationService()
        db = Mock()
        db.execute = AsyncMock(
            side_effect=[
                database_result(row=link_candidate_row()),
                database_result(row=None),
            ]
        )
        db.commit = AsyncMock(
            side_effect=[
                None,
                RuntimeError("failure audit unavailable"),
                RuntimeError("failure audit unavailable"),
            ]
        )
        db.rollback = AsyncMock()
        db.add = Mock()
        provider = safe_provider()

        with pytest.raises(NotFoundException):
            await service.link_rp_application_to_workspace(
                db=db,
                current_user=cl_admin_user(),
                rp_application_uuid=RP_APPLICATION_UUID,
                payload=RPApplicationWorkspaceLinkWrite(
                    workspace_uuid=WORKSPACE_UUID,
                    application_information_uuid=APPLICATION_INFORMATION_UUID,
                    canada_login_environment="production",
                ),
                metadata_provider=provider,
                correlation_id="request-failure-audit-unavailable",
            )

        provider.get_registration_metadata.assert_not_awaited()
        assert db.add.call_count == 3
        assert db.commit.await_count == 3
        assert db.rollback.await_count == 3

    @pytest.mark.asyncio
    async def test_missing_workspace_fails_before_provider_or_mutation(self) -> None:
        service = RPApplicationService()
        db = Mock()
        db.execute = AsyncMock(
            side_effect=[
                database_result(row=link_candidate_row()),
                database_result(row=None),
            ]
        )
        db.commit = AsyncMock()
        db.rollback = AsyncMock()
        db.add = Mock()
        provider = safe_provider()

        with pytest.raises(NotFoundException):
            await service.link_rp_application_to_workspace(
                db=db,
                current_user=cl_admin_user(),
                rp_application_uuid=RP_APPLICATION_UUID,
                payload=RPApplicationWorkspaceLinkWrite(
                    workspace_uuid=WORKSPACE_UUID,
                    application_information_uuid=APPLICATION_INFORMATION_UUID,
                    canada_login_environment="production",
                ),
                metadata_provider=provider,
                correlation_id="request-missing-workspace",
            )

        provider.get_registration_metadata.assert_not_awaited()
        assert db.add.call_count == 2
        assert db.commit.await_count == 2
        db.rollback.assert_awaited_once()


class TestRPApplicationAdoptionAPI:
    def teardown_method(self) -> None:
        app.dependency_overrides.clear()

    def test_candidate_list_serializes_public_camel_case_contract(self) -> None:
        service = Mock()
        service.list_rp_application_adoption_candidates = AsyncMock(
            return_value={
                "items": [
                    {
                        "rpApplicationUuid": str(RP_APPLICATION_UUID),
                        "name": "Portal Name",
                        "configurationName": "Portal production",
                        "ibmApplicationId": "ibm-app-401",
                        "metadataCompleteness": "incomplete",
                        "missingFieldNames": ["logoutUri"],
                        "updatedAt": None,
                    }
                ]
            }
        )
        app.dependency_overrides[get_current_user] = cl_admin_user
        app.dependency_overrides[get_rp_application_service] = lambda: service
        app.dependency_overrides[async_get_db] = lambda: Mock()

        client = TestClient(app)
        try:
            response = client.get("/api/v1/rp-applications/workspace-adoption-candidates")
        finally:
            client.close()

        assert response.status_code == 200
        assert response.json()["items"][0] == {
            "rpApplicationUuid": str(RP_APPLICATION_UUID),
            "name": "Portal Name",
            "configurationName": "Portal production",
            "partnerEnvironment": None,
            "ibmApplicationId": "ibm-app-401",
            "metadataCompleteness": "incomplete",
            "missingFieldNames": ["logoutUri"],
            "updatedAt": None,
        }

    def test_preview_passes_injected_safe_provider_to_service(self) -> None:
        service = Mock()
        service.preview_rp_application_adoption_candidate = AsyncMock(
            return_value={
                "candidate": {
                    "rpApplicationUuid": str(RP_APPLICATION_UUID),
                    "name": "Portal Name",
                    "configurationName": "Portal production",
                    "ibmApplicationId": "ibm-app-401",
                    "metadataCompleteness": "incomplete",
                    "missingFieldNames": ["logoutUri"],
                    "updatedAt": None,
                },
                "fields": [
                    {
                        "fieldName": "logoutUri",
                        "status": "fillable",
                        "localValue": None,
                        "providerValue": "https://portal.example/logout",
                    }
                ],
                "fillableFieldNames": ["logoutUri"],
                "preservedLocalFieldNames": [],
                "conflictingFieldNames": [],
            }
        )
        provider = Mock()
        app.dependency_overrides[get_current_user] = cl_admin_user
        app.dependency_overrides[get_rp_application_service] = lambda: service
        app.dependency_overrides[get_rp_application_adoption_metadata_provider] = lambda: provider
        app.dependency_overrides[async_get_db] = lambda: Mock()

        client = TestClient(app)
        try:
            response = client.get(f"/api/v1/rp-applications/workspace-adoption-candidates/{RP_APPLICATION_UUID}")
        finally:
            client.close()

        assert response.status_code == 200
        assert response.json()["fillableFieldNames"] == ["logoutUri"]
        service.preview_rp_application_adoption_candidate.assert_awaited_once()
        assert service.preview_rp_application_adoption_candidate.await_args.kwargs["metadata_provider"] is provider

    def test_openapi_declares_safe_preview_errors_and_no_internal_ids(self) -> None:
        schema = app.openapi()
        path = schema["paths"]["/api/v1/rp-applications/workspace-adoption-candidates/{rp_application_uuid}"]["get"]

        assert set(path["responses"]) >= {"200", "401", "403", "404", "500", "503"}
        candidate_schema = schema["components"]["schemas"]["RPApplicationAdoptionCandidateRead"]
        assert "id" not in candidate_schema["properties"]
        assert "applicationOwner" not in candidate_schema["properties"]
        assert "oidcRegistrationPayload" not in candidate_schema["properties"]

    def test_workspace_link_serializes_camel_case_and_passes_correlation_id(
        self,
    ) -> None:
        service = Mock()
        service.link_rp_application_to_workspace = AsyncMock(
            return_value={
                "rpApplicationUuid": str(RP_APPLICATION_UUID),
                "workspaceUuid": str(WORKSPACE_UUID),
                "departmentUuid": str(DEPARTMENT_UUID),
                "applicationInformationUuid": str(APPLICATION_INFORMATION_UUID),
                "ibmApplicationId": "ibm-app-401",
                "name": "Portal Name",
                "configurationName": "Portal production",
                "canadaLoginEnvironment": "production",
                "filledFieldNames": ["redirectUris"],
                "preservedLocalFieldNames": ["displayName"],
                "conflictingFieldNames": [],
                "idempotentReplay": False,
            }
        )
        provider = Mock()
        app.dependency_overrides[get_current_user] = cl_admin_user
        app.dependency_overrides[get_rp_application_service] = lambda: service
        app.dependency_overrides[get_rp_application_adoption_metadata_provider] = lambda: provider
        app.dependency_overrides[async_get_db] = lambda: Mock()

        client = TestClient(app)
        try:
            response = client.put(
                f"/api/v1/rp-applications/{RP_APPLICATION_UUID}/workspace-link",
                headers={"X-Request-ID": "request-api-link"},
                json={
                    "workspaceUuid": str(WORKSPACE_UUID),
                    "applicationInformationUuid": str(APPLICATION_INFORMATION_UUID),
                    "canadaLoginEnvironment": "production",
                },
            )
        finally:
            client.close()

        assert response.status_code == 200
        assert response.json()["workspaceUuid"] == str(WORKSPACE_UUID)
        assert response.json()["idempotentReplay"] is False
        kwargs = service.link_rp_application_to_workspace.await_args.kwargs
        assert kwargs["payload"].workspace_uuid == WORKSPACE_UUID
        assert kwargs["metadata_provider"] is provider
        assert kwargs["correlation_id"] == "request-api-link"

    def test_workspace_link_has_safe_error_contract_and_no_internal_ids(self) -> None:
        schema = app.openapi()
        path = schema["paths"]["/api/v1/rp-applications/{rp_application_uuid}/workspace-link"]["put"]

        assert set(path["responses"]) >= {
            "200",
            "400",
            "401",
            "403",
            "404",
            "409",
            "500",
            "503",
        }
        response_schema = schema["components"]["schemas"]["RPApplicationWorkspaceAdoptionRead"]
        assert "id" not in response_schema["properties"]
        assert "applicationOwner" not in response_schema["properties"]
        assert "oidcRegistrationPayload" not in response_schema["properties"]

    def test_workspace_link_conflict_uses_stable_error_code(self) -> None:
        service = Mock()
        service.link_rp_application_to_workspace = AsyncMock(
            side_effect=RPApplicationAdoptionConflictException(),
        )
        app.dependency_overrides[get_current_user] = cl_admin_user
        app.dependency_overrides[get_rp_application_service] = lambda: service
        app.dependency_overrides[get_rp_application_adoption_metadata_provider] = lambda: Mock()
        app.dependency_overrides[async_get_db] = lambda: Mock()

        client = TestClient(app)
        try:
            response = client.put(
                f"/api/v1/rp-applications/{RP_APPLICATION_UUID}/workspace-link",
                json={
                    "workspaceUuid": str(WORKSPACE_UUID),
                    "applicationInformationUuid": str(APPLICATION_INFORMATION_UUID),
                },
            )
        finally:
            client.close()

        assert response.status_code == 409
        assert response.json()["error"]["code"] == "rp_application_already_linked"
