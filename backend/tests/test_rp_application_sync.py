from unittest.mock import AsyncMock, Mock

import pytest
from ibm_verify_community_sdk.applications.models import ListApplicationsResponse

import src.app.core.worker.functions as worker_functions_module
import src.app.core.worker.settings as worker_settings_module
import src.app.services.rp_application_service as rp_application_sync_module
from src.app.core.config import settings
from src.app.core.worker.functions import sync_ibm_verify_rp_applications
from src.app.core.worker.settings import WorkerSettings
from src.app.services.rp_application_service import RPApplicationService


class TestRPApplicationServiceSync:
    @pytest.mark.asyncio
    async def test_sync_rp_applications_creates_without_ingesting_owner_snapshot(self) -> None:
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
        ibm_admin_client.get_application_detail = AsyncMock()

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

        assert result == {"created": 1, "updated": 0, "skipped": 1, "processed": 2}
        ibm_admin_client.get_application_detail.assert_not_awaited()
        create_mock.assert_awaited_once()
        update_mock.assert_not_awaited()

        created_object = create_mock.await_args.kwargs["object"]
        assert created_object.department_id is None
        assert created_object.dnr_app_name == "Example App"
        assert created_object.ibm_sv_application_id == "ibm-app-1"
        assert not hasattr(created_object, "application_owner")

    @pytest.mark.asyncio
    async def test_sync_rp_applications_never_backfills_access_from_owner_email(self) -> None:
        service = RPApplicationService()
        db = Mock()
        ibm_admin_client = Mock()
        ibm_admin_client.list_applications = AsyncMock(
            return_value=ListApplicationsResponse.model_validate(
                {
                    "_embedded": {
                        "applications": [
                            {"applicationRefId": "ibm-app-2", "name": "Existing App"},
                        ]
                    }
                }
            )
        )
        ibm_admin_client.get_application_detail = AsyncMock()

        existing_application = {
            "uuid": "018f6f83-0000-0000-0000-000000000201",
            "workspace_id": 9,
            "dnr_app_name": "Existing App",
            "application_owner": {"owners": [{"email": "owner@example.gc.ca"}]},
        }

        application_get_mock = AsyncMock(return_value=existing_application)
        application_update_mock = AsyncMock(return_value=None)
        original_application_get = rp_application_sync_module.crud_rp_applications.get
        original_application_update = rp_application_sync_module.crud_rp_applications.update
        rp_application_sync_module.crud_rp_applications.get = application_get_mock
        rp_application_sync_module.crud_rp_applications.update = application_update_mock

        try:
            result = await service.sync_rp_applications_from_ibm_verify(
                db=db,
                ibm_admin_client=ibm_admin_client,
            )
        finally:
            rp_application_sync_module.crud_rp_applications.get = original_application_get
            rp_application_sync_module.crud_rp_applications.update = original_application_update

        assert result == {"created": 0, "updated": 0, "skipped": 1, "processed": 1}
        ibm_admin_client.get_application_detail.assert_not_awaited()
        application_update_mock.assert_not_awaited()
        assert not hasattr(rp_application_sync_module, "crud_rp_application_access_grants")
        assert not hasattr(rp_application_sync_module, "crud_users")


class TestWorkerCronConfiguration:
    def test_worker_settings_registers_inert_handler_but_does_not_schedule_sync_by_default(self) -> None:
        assert settings.IBM_RP_APPLICATION_SYNC_ENABLED is False
        assert WorkerSettings.functions == [sync_ibm_verify_rp_applications]

        cron_job_names = [job.name for job in WorkerSettings.cron_jobs]
        assert "sync_ibm_verify_rp_applications" not in cron_job_names

    def test_explicit_opt_in_registers_existing_ten_minute_schedule(self) -> None:
        functions, cron_jobs = worker_settings_module._build_worker_registrations(
            ibm_rp_application_sync_enabled=True,
            load_mau_enabled=False,
        )

        assert sync_ibm_verify_rp_applications in functions
        assert [job.name for job in cron_jobs] == ["sync_ibm_verify_rp_applications"]
        sync_job = cron_jobs[0]
        assert sync_job.minute == {0, 10, 20, 30, 40, 50}
        assert sync_job.run_at_startup is True

    def test_load_mau_registration_remains_independent(self) -> None:
        cron_job_names = [job.name for job in WorkerSettings.cron_jobs]
        if settings.LOAD_MAU_ENABLED:
            assert "load_mau_data" in cron_job_names
            mau_job = WorkerSettings.cron_jobs[cron_job_names.index("load_mau_data")]
            assert mau_job.hour is None
            assert mau_job.minute == 55
            assert mau_job.run_at_startup is True


class TestWorkerSyncJob:
    @pytest.mark.asyncio
    async def test_disabled_sync_stops_before_time_client_service_or_db(
        self,
        monkeypatch: pytest.MonkeyPatch,
    ) -> None:
        in_hour_window = Mock(return_value=True)
        client_factory = AsyncMock()
        service_factory = Mock()
        session_factory = Mock()
        monkeypatch.setattr(settings, "IBM_RP_APPLICATION_SYNC_ENABLED", False)
        monkeypatch.setattr(worker_functions_module, "is_in_hour_window", in_hour_window)
        monkeypatch.setattr(worker_functions_module, "get_ibm_sv_admin_client", client_factory)
        monkeypatch.setattr(worker_functions_module, "get_rp_application_service", service_factory)
        monkeypatch.setattr(worker_functions_module, "local_session", session_factory)

        result = await sync_ibm_verify_rp_applications({"job_id": "job-disabled"})

        assert result == {"skipped": True}
        in_hour_window.assert_not_called()
        client_factory.assert_not_awaited()
        service_factory.assert_not_called()
        session_factory.assert_not_called()

    @pytest.mark.asyncio
    async def test_enabled_sync_uses_shared_service_and_db(self, monkeypatch: pytest.MonkeyPatch) -> None:
        db = Mock()
        mock_session = Mock()
        mock_session.__aenter__ = AsyncMock(return_value=db)
        mock_session.__aexit__ = AsyncMock(return_value=None)

        mock_client = Mock()
        mock_service = Mock()
        mock_service.sync_rp_applications_from_ibm_verify = AsyncMock(return_value={"created": 1, "updated": 0, "skipped": 0, "processed": 1})

        monkeypatch.setattr(settings, "IBM_RP_APPLICATION_SYNC_ENABLED", True)
        monkeypatch.setattr(worker_functions_module, "is_in_hour_window", Mock(return_value=True))
        monkeypatch.setattr(worker_functions_module, "get_ibm_sv_admin_client", AsyncMock(return_value=mock_client))
        monkeypatch.setattr(worker_functions_module, "local_session", Mock(return_value=mock_session))
        monkeypatch.setattr(worker_functions_module, "get_rp_application_service", Mock(return_value=mock_service))

        result = await sync_ibm_verify_rp_applications({"job_id": "job-1"})

        assert result == {"created": 1, "updated": 0, "skipped": 0, "processed": 1}
        mock_service.sync_rp_applications_from_ibm_verify.assert_awaited_once_with(db=db, ibm_admin_client=mock_client)
