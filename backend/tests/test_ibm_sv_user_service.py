from unittest.mock import AsyncMock, Mock, patch

import pytest
from ibm_verify_community_sdk.applications.models import Application, GetApplicationsResponse

from src.app.services.ibm_sv_user_service import IBMVerifyUserService
from src.app.services.rp_application_service import RPApplicationService


class TestIBMVerifyUserService:
    @pytest.mark.asyncio
    async def test_get_applications_normalizes_payload_and_checks_membership(self) -> None:
        client = Mock()
        client.fetch_applications = AsyncMock(
            return_value=GetApplicationsResponse(
                totalCount=2,
                applications=[
                    Application(
                        name="One",
                        links=[],
                        status=[],
                        category=[],
                        id="app-1",
                        discretionaryApp=False,
                    ),
                    Application(
                        name="Two",
                        links=[],
                        status=[],
                        category=[],
                        id="app-2",
                        discretionaryApp=False,
                    ),
                ],
            )
        )
        service = IBMVerifyUserService(client=client)

        applications = await service.get_applications()

        assert len(applications) == 2
        assert await service.has_application("app-2") is True
        assert await service.has_application("missing") is False


class TestRPApplicationServiceCurrentUserSync:
    @pytest.mark.asyncio
    async def test_list_current_user_rp_applications_returns_empty_without_user_email(self, mock_db) -> None:
        service = RPApplicationService()
        current_user = {"id": 11, "department_id": 7}
        ibm_user_service = Mock()
        ibm_user_service.get_applications = AsyncMock(return_value=[{"applicationId": "app-1", "name": "App One"}])

        with patch("src.app.services.rp_application_service.crud_rp_applications") as mock_crud:
            mock_crud.get_multi = AsyncMock(return_value={"data": []})
            mock_crud.update = AsyncMock(return_value=None)
            mock_crud.create = AsyncMock(return_value=None)

            result = await service.list_current_user_rp_applications(
                db=mock_db,
                current_user=current_user,
                ibm_user_service=ibm_user_service,
            )

        assert result == []
        mock_crud.update.assert_not_awaited()
        mock_crud.create.assert_not_awaited()
        mock_crud.get_multi.assert_not_awaited()
        ibm_user_service.get_applications.assert_not_awaited()

    @pytest.mark.asyncio
    async def test_list_current_user_rp_applications_includes_owner_email_matches(self, mock_db) -> None:
        service = RPApplicationService()
        current_user = {"id": 11, "email": "yiwei.wang@cds-snc.ca"}
        ibm_user_service = Mock()
        ibm_user_service.get_applications = AsyncMock(return_value=[])

        owner_matched_row = {
            "id": 3,
            "uuid": "018f6f83-0000-0000-0000-000000000103",
            "department_id": 7,
            "dnr_app_name": "Owner Matched App",
            "created_by": 2,
            "ibm_sv_application_id": "app-owner-match",
            "application_owner": {
                "owners": [
                    {"email": "yiwei.wang@cds-snc.ca"},
                    {"email": "yiwei.wang+0609@cds-snc.ca"},
                ]
            },
        }
        non_matched_row = {
            "id": 4,
            "uuid": "018f6f83-0000-0000-0000-000000000104",
            "department_id": 7,
            "dnr_app_name": "Not Owned",
            "created_by": 2,
            "ibm_sv_application_id": "app-not-owned",
            "application_owner": {
                "owners": [
                    {"email": "someone.else@cds-snc.ca"},
                ]
            },
        }

        with patch("src.app.services.rp_application_service.crud_rp_applications") as mock_crud:
            mock_crud.get_multi = AsyncMock(return_value={"data": [owner_matched_row, non_matched_row]})
            mock_crud.update = AsyncMock(return_value=None)
            mock_crud.create = AsyncMock(return_value=None)

            result = await service.list_current_user_rp_applications(
                db=mock_db,
                current_user=current_user,
                ibm_user_service=ibm_user_service,
            )

        assert len(result) == 1
        assert result[0]["ibm_sv_application_id"] == "app-owner-match"
        mock_crud.create.assert_not_awaited()
        ibm_user_service.get_applications.assert_not_awaited()
