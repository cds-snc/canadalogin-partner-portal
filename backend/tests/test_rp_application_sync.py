from unittest.mock import AsyncMock, Mock

import pytest
from ibm_verify_community_sdk.applications.models import (
    GetApplicationResponse,
    ListApplicationsResponse,
)

import src.app.services.rp_application_service as rp_application_sync_module
from src.app.core.worker.functions import sync_ibm_verify_rp_applications
from src.app.core.worker.settings import WorkerSettings
from src.app.services.rp_application_service import RPApplicationService


class TestRPApplicationServiceSync:
    @pytest.mark.asyncio
    async def test_sync_rp_applications_creates_and_updates_owner_snapshot(self) -> None:
        service = RPApplicationService()
        db = Mock()
        ibm_admin_client = Mock()
        ibm_admin_client.list_applications = AsyncMock(
            return_value=ListApplicationsResponse.model_validate(
                {
                    "_embedded": {
                        "applications": [
                            {"applicationRefId": "ibm-app-1", "name": "Example App"},
                            {"applicationRefId": "ibm-app-2", "name": "Existing App"},
                        ]
                    }
                }
            )
        )
        ibm_admin_client.get_application_detail = AsyncMock(
            side_effect=[
                GetApplicationResponse.model_validate(
                    {"owners": [{"email": "owner@example.gc.ca"}, {"email": "backup@example.gc.ca"}]}
                ),
                GetApplicationResponse.model_validate(
                    {"owners": [{"email": "updated@example.gc.ca"}]}
                ),
            ]
        )

        existing_application = {
            "uuid": "018f6f83-0000-0000-0000-000000000201",
            "dnr_app_name": "Existing App",
            "application_owner": {"owners": [{"email": "old@example.gc.ca"}]},
        }

        get_mock = AsyncMock(side_effect=[None, existing_application])
        create_mock = AsyncMock(return_value={"uuid": "018f6f83-0000-0000-0000-000000000202"})
        update_mock = AsyncMock(return_value={"uuid": existing_application["uuid"]})

        original_get = rp_application_sync_module.crud_rp_applications.get
        original_create = rp_application_sync_module.crud_rp_applications.create
        original_update = rp_application_sync_module.crud_rp_applications.update
        rp_application_sync_module.crud_rp_applications.get = get_mock
        rp_application_sync_module.crud_rp_applications.create = create_mock
        rp_application_sync_module.crud_rp_applications.update = update_mock
        try:
            result = await service.sync_rp_applications_from_ibm_verify(db=db, ibm_admin_client=ibm_admin_client)
        finally:
            rp_application_sync_module.crud_rp_applications.get = original_get
            rp_application_sync_module.crud_rp_applications.create = original_create
            rp_application_sync_module.crud_rp_applications.update = original_update

        assert result == {"created": 1, "updated": 1, "skipped": 0, "processed": 2}
        ibm_admin_client.get_application_detail.assert_awaited()
        assert ibm_admin_client.get_application_detail.await_count == 2
        create_mock.assert_awaited_once()
        update_mock.assert_awaited_once()

        created_object = create_mock.await_args.kwargs["object"]
        assert created_object.department_id is None
        assert created_object.dnr_app_name == "Example App"
        assert created_object.ibm_sv_application_id == "ibm-app-1"
        assert created_object.application_owner.model_dump(by_alias=True) == {
            "owners": [{"email": "owner@example.gc.ca"}, {"email": "backup@example.gc.ca"}]
        }

        updated_object = update_mock.await_args.kwargs["object"]
        assert updated_object["application_owner"] == {"owners": [{"email": "updated@example.gc.ca"}]}


class TestWorkerCronConfiguration:
    def test_worker_settings_registers_cron_jobs(self) -> None:
        assert len(WorkerSettings.cron_jobs) == 2

        sync_job = WorkerSettings.cron_jobs[0]
        assert sync_job.name == "sync_ibm_verify_rp_applications"
        assert sync_job.minute == {0, 10, 20, 30, 40, 50}
        assert sync_job.run_at_startup is True

        mau_job = WorkerSettings.cron_jobs[1]
        assert mau_job.name == "load_mau_data"
        assert mau_job.hour is None
        assert mau_job.minute == 55
        assert mau_job.run_at_startup is True


class TestWorkerSyncJob:
    @pytest.mark.asyncio
    async def test_sync_ibm_verify_rp_applications_uses_shared_service_and_db(self, monkeypatch: pytest.MonkeyPatch) -> None:
        db = Mock()
        mock_session = Mock()
        mock_session.__aenter__ = AsyncMock(return_value=db)
        mock_session.__aexit__ = AsyncMock(return_value=None)

        mock_client = Mock()
        mock_service = Mock()
        mock_service.sync_rp_applications_from_ibm_verify = AsyncMock(return_value={"created": 1, "updated": 0, "skipped": 0, "processed": 1})

        monkeypatch.setattr("src.app.core.worker.functions.get_ibm_sv_admin_client", AsyncMock(return_value=mock_client))
        monkeypatch.setattr("src.app.core.worker.functions.local_session", Mock(return_value=mock_session))
        monkeypatch.setattr("src.app.core.worker.functions.get_rp_application_service", Mock(return_value=mock_service))

        result = await sync_ibm_verify_rp_applications({"job_id": "job-1"})

        assert result == {"created": 1, "updated": 0, "skipped": 0, "processed": 1}
        mock_service.sync_rp_applications_from_ibm_verify.assert_awaited_once_with(db=db, ibm_admin_client=mock_client)
