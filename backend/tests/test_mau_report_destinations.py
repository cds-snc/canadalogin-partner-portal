from unittest.mock import AsyncMock, Mock

import pytest
from src.app.services.rp_application_service import RPApplicationService


@pytest.mark.asyncio
async def test_destination_list_is_server_scoped_and_omits_task_state() -> None:
    service = RPApplicationService()
    service.list_accessible_rp_applications = AsyncMock(  # type: ignore[method-assign]
        return_value=[
            {
                "uuid": "018f6f83-0000-0000-0000-000000000331",
                "workspaceUuid": "018f6f83-0000-0000-0000-000000000201",
                "workspaceName": "Benefits Workspace",
                "serviceNameEn": "Legacy candidate",
                "serviceNameFr": "Candidat historique",
                "configurationName": "Unadopted",
                "applicationInformationUuid": None,
                "partnerEnvironment": None,
                "canadaLoginEnvironment": "test",
                "registrationCompletedAt": None,
                "productionReviewStatus": None,
                "resumeTaskPath": None,
                "role": "read_only",
            },
            {
                "uuid": "018f6f83-0000-0000-0000-000000000332",
                "workspaceUuid": "018f6f83-0000-0000-0000-000000000201",
                "workspaceName": "Benefits Workspace",
                "serviceNameEn": "Benefits service",
                "serviceNameFr": "Service de prestations",
                "configurationName": "Benefits production",
                "applicationInformationUuid": "018f6f83-0000-0000-0000-000000000401",
                "partnerEnvironment": "Partner production",
                "canadaLoginEnvironment": "production",
                "registrationCompletedAt": "2026-08-25T15:00:00Z",
                "productionReviewStatus": "pending",
                "resumeTaskPath": None,
                "role": "read_only",
            },
        ]
    )

    destinations = await service.list_accessible_mau_report_destinations(
        db=Mock(),
        current_user={"id": 77},
    )

    assert destinations == [
        {
            "uuid": "018f6f83-0000-0000-0000-000000000332",
            "workspaceUuid": "018f6f83-0000-0000-0000-000000000201",
            "workspaceName": "Benefits Workspace",
            "applicationInformationUuid": "018f6f83-0000-0000-0000-000000000401",
            "applicationNameEn": "Benefits service",
            "applicationNameFr": "Service de prestations",
            "configurationName": "Benefits production",
            "partnerEnvironment": "Partner production",
            "canadaLoginEnvironment": "production",
        }
    ]
    assert "role" not in destinations[0]
    assert "productionReviewStatus" not in destinations[0]
    assert "registrationCompletedAt" not in destinations[0]
