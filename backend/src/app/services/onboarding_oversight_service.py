import csv
from calendar import monthrange
from datetime import UTC, date, datetime, timedelta
from io import StringIO
from typing import Any, cast
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from ..core.authorization import (
    CanonicalResourceScopeDecisionPoint,
    Capability,
    ResourceScopeRequest,
)
from ..core.exceptions.http_exceptions import (
    NotFoundException,
    OnboardingReportRequestException,
)
from ..repositories.crud_application_information import crud_application_information
from ..repositories.crud_audit_log import crud_audit_log
from ..repositories.crud_departments import crud_departments
from ..repositories.crud_rp_application_developer_invitations import (
    crud_rp_application_developer_invitations,
)
from ..repositories.crud_rp_application_promotion_requests import (
    crud_rp_application_promotion_requests,
)
from ..repositories.crud_rp_applications import crud_rp_applications
from ..repositories.crud_workspaces import crud_workspaces
from ..schemas.application_information import ApplicationInformationRead
from ..schemas.audit_log import AuditLogRead
from ..schemas.department import DepartmentRead
from ..schemas.onboarding import OnboardingState
from ..schemas.onboarding_oversight import (
    OnboardingOversightQueueRowRead,
    OnboardingOversightRecordType,
    OnboardingOversightReportAppliedFiltersRead,
    OnboardingOversightReportGroupBy,
    OnboardingOversightReportMetric,
    OnboardingOversightReportRead,
    OnboardingOversightReportRowRead,
    OnboardingOversightReportSummaryRead,
)
from ..schemas.rp_application import CanadaLoginEnvironment, RPApplicationRead
from ..schemas.rp_application_promotion_request import PromotionRequestStatus
from ..schemas.workspace import WorkspaceRead
from .authorization_service import get_resolved_authorization_state

VISIBLE_QUEUE_STATES: set[str] = {"submitted", "under_review", "approved", "launched"}
STATE_SORT_PRIORITY: dict[str, int] = {
    "under_review": 0,
    "submitted": 1,
    "approved": 2,
    "launched": 3,
    "draft": 4,
}
PRODUCTION_TARGET_ENVIRONMENT = "production"
SECRET_ROTATION_AUDIT_OPERATIONS = {"ROTATE_SECRET", "REGENERATE"}
SUPPORTED_REPORT_METRICS: set[str] = {
    "onboarding_throughput",
    "invitation_conversion",
    "secret_rotation_hygiene",
}
SUPPORTED_REPORT_GROUP_BY: set[str] = {"day", "week", "month"}


class OnboardingOversightService:
    def __init__(self) -> None:
        self._decision_point = CanonicalResourceScopeDecisionPoint()

    async def _resolve_report_workspace_scope(
        self,
        *,
        db: AsyncSession,
        current_user: dict[str, Any] | None,
        workspace_uuid: str | None,
    ) -> tuple[int | None, UUID | None]:
        state = get_resolved_authorization_state(current_user) if current_user is not None else None
        if state is None:
            raise NotFoundException("Report not found")

        normalized_workspace_uuid: UUID | None = None
        if workspace_uuid is not None:
            try:
                normalized_workspace_uuid = UUID(str(workspace_uuid))
            except (TypeError, ValueError, AttributeError) as exc:
                raise OnboardingReportRequestException(
                    code="onboarding_report_invalid_workspace",
                    message="Workspace scope must be a valid UUID.",
                ) from exc
        elif not state.is_cl_admin:
            raise OnboardingReportRequestException(
                code="onboarding_report_workspace_required",
                message="Partner reporting requires exactly one active workspace.",
            )

        decision = self._decision_point.decide(
            ResourceScopeRequest(
                role_scopes=state.role_scopes,
                capability=Capability.AGGREGATE_REPORT_READ,
                resource_workspace_uuid=normalized_workspace_uuid,
            )
        )
        if not decision.allowed:
            raise NotFoundException("Report not found")
        if normalized_workspace_uuid is None:
            return None, None

        workspace = await crud_workspaces.get(
            db=db,
            uuid=normalized_workspace_uuid,
            is_deleted=False,
            schema_to_select=WorkspaceRead,
        )
        if workspace is None:
            raise NotFoundException("Report not found")
        return int(workspace["id"]), normalized_workspace_uuid

    async def get_report(
        self,
        db: AsyncSession,
        *,
        metric: str,
        start_date: str,
        end_date: str,
        group_by: str | None = None,
        workspace_uuid: str | None = None,
        department_id: str | None = None,
        environment: str | None = None,
        current_user: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        resolved_metric = self._parse_report_metric(metric)
        resolved_start_date = self._parse_report_date(start_date)
        resolved_end_date = self._parse_report_date(end_date)
        if resolved_start_date > resolved_end_date:
            raise OnboardingReportRequestException(
                code="onboarding_report_invalid_date_range",
                message="Start date must be on or before end date.",
            )

        if department_id or environment:
            raise OnboardingReportRequestException(
                code="onboarding_report_unsupported_filter",
                message=("Department and environment filters are not available in the first onboarding reporting release."),
            )

        workspace_scope_id, resolved_workspace_uuid = await self._resolve_report_workspace_scope(
            db=db,
            current_user=current_user,
            workspace_uuid=workspace_uuid,
        )

        resolved_group_by = self._parse_report_group_by(group_by)
        if resolved_metric == "secret_rotation_hygiene" and resolved_group_by is not None:
            raise OnboardingReportRequestException(
                code="onboarding_report_invalid_filter_combination",
                message=("Grouping is not available for secret rotation hygiene in the first onboarding reporting release."),
            )

        if resolved_metric == "onboarding_throughput":
            return await self._build_throughput_report(
                db=db,
                start_date=resolved_start_date,
                end_date=resolved_end_date,
                group_by=resolved_group_by or "week",
                workspace_id=workspace_scope_id,
                workspace_uuid=resolved_workspace_uuid,
            )
        if resolved_metric == "invitation_conversion":
            return await self._build_invitation_conversion_report(
                db=db,
                start_date=resolved_start_date,
                end_date=resolved_end_date,
                group_by=resolved_group_by or "week",
                workspace_id=workspace_scope_id,
                workspace_uuid=resolved_workspace_uuid,
            )

        return await self._build_secret_rotation_hygiene_report(
            db=db,
            start_date=resolved_start_date,
            end_date=resolved_end_date,
            workspace_id=workspace_scope_id,
            workspace_uuid=resolved_workspace_uuid,
        )

    async def export_report_csv(
        self,
        db: AsyncSession,
        *,
        metric: str,
        start_date: str,
        end_date: str,
        group_by: str | None = None,
        workspace_uuid: str | None = None,
        department_id: str | None = None,
        environment: str | None = None,
        current_user: dict[str, Any] | None = None,
    ) -> tuple[str, str]:
        report = await self.get_report(
            db=db,
            metric=metric,
            start_date=start_date,
            end_date=end_date,
            group_by=group_by,
            workspace_uuid=workspace_uuid,
            department_id=department_id,
            environment=environment,
            current_user=current_user,
        )
        csv_content = self._serialize_report_csv(report)
        applied_filters = report["applied_filters"]
        filename = f"{report['metric']}-{applied_filters['start_date']}-{applied_filters['end_date']}.csv"
        return csv_content, filename

    async def list_queue(
        self,
        db: AsyncSession,
        *,
        onboarding_state: OnboardingState | None = None,
        record_type: OnboardingOversightRecordType | None = None,
        department: str | None = None,
        workspace: str | None = None,
        environment: CanadaLoginEnvironment | None = None,
        promotion_status: PromotionRequestStatus | None = None,
    ) -> list[dict[str, Any]]:
        departments_by_id = await self._list_departments_by_id(db=db)
        workspaces = await crud_workspaces.get_multi(
            db=db,
            is_deleted=False,
            return_as_model=False,
            schema_to_select=WorkspaceRead,
        )
        workspace_rows = workspaces.get("data", [])
        workspaces_by_id = {workspace_row["id"]: workspace_row for workspace_row in workspace_rows}

        queue_rows: list[dict[str, Any]] = []
        for workspace_row in workspace_rows:
            if not self._is_visible_queue_state(workspace_row.get("onboarding_state")):
                continue
            department_id = workspace_row.get("department_id")
            queue_rows.append(
                self._build_queue_row(
                    record_type="workspace",
                    record_uuid=workspace_row["uuid"],
                    primary_record_label=workspace_row["name"],
                    workspace_uuid=workspace_row["uuid"],
                    workspace_name=workspace_row["name"],
                    department=departments_by_id.get(department_id) if isinstance(department_id, int) else None,
                    onboarding_state=workspace_row.get("onboarding_state"),
                    current_environment=None,
                    target_environment=None,
                    promotion_status=None,
                    external_review_reference=None,
                    last_activity_at=self._select_lifecycle_timestamp(workspace_row),
                    detail_path=f"/workspaces/{workspace_row['uuid']}",
                )
            )

        application_information_records = await crud_application_information.get_multi(
            db=db,
            is_deleted=False,
            return_as_model=False,
            schema_to_select=ApplicationInformationRead,
        )
        application_information_rows = application_information_records.get("data", [])
        application_information_by_id = {row["id"]: row for row in application_information_rows}
        for application_information_row in application_information_rows:
            if not self._is_visible_queue_state(application_information_row.get("onboarding_state")):
                continue

            workspace_id = application_information_row.get("workspace_id")
            parent_workspace = workspaces_by_id.get(workspace_id) if isinstance(workspace_id, int) else None
            if parent_workspace is None:
                continue
            department_id = parent_workspace.get("department_id")

            queue_rows.append(
                self._build_queue_row(
                    record_type="application_information",
                    record_uuid=application_information_row["uuid"],
                    primary_record_label=application_information_row["service_name_en"],
                    workspace_uuid=parent_workspace["uuid"],
                    workspace_name=parent_workspace["name"],
                    department=departments_by_id.get(department_id) if isinstance(department_id, int) else None,
                    onboarding_state=application_information_row.get("onboarding_state"),
                    current_environment=None,
                    target_environment=None,
                    promotion_status=None,
                    external_review_reference=None,
                    last_activity_at=self._select_lifecycle_timestamp(application_information_row),
                    detail_path=(f"/workspaces/{parent_workspace['uuid']}/applications/{application_information_row['uuid']}"),
                )
            )

        rp_applications = await crud_rp_applications.get_multi(
            db=db,
            is_deleted=False,
            return_as_model=False,
            schema_to_select=RPApplicationRead,
        )
        for rp_application_row in rp_applications.get("data", []):
            workspace_id = rp_application_row.get("workspace_id")
            parent_workspace = workspaces_by_id.get(workspace_id) if isinstance(workspace_id, int) else None
            if parent_workspace is None:
                continue
            configuration_label = rp_application_row.get("configuration_name") or rp_application_row.get("dnr_app_name") or "RP configuration"
            application_information_id = rp_application_row.get("application_information_id")
            parent_application = (
                application_information_by_id.get(application_information_id) if isinstance(application_information_id, int) else None
            )
            configuration_detail_path = (
                f"/workspaces/{parent_workspace['uuid']}/applications/{parent_application['uuid']}/rp-configurations/{rp_application_row['uuid']}"
                if parent_application is not None
                else "/error?kind=not_found"
            )
            department_id = parent_workspace.get("department_id")

            promotion_request = await self._get_production_promotion_request(
                db=db,
                rp_application=rp_application_row,
            )

            if self._is_visible_queue_state(rp_application_row.get("onboarding_state")):
                queue_rows.append(
                    self._build_queue_row(
                        record_type="rp_application",
                        record_uuid=rp_application_row["uuid"],
                        primary_record_label=configuration_label,
                        workspace_uuid=parent_workspace["uuid"],
                        workspace_name=parent_workspace["name"],
                        department=departments_by_id.get(department_id) if isinstance(department_id, int) else None,
                        onboarding_state=rp_application_row.get("onboarding_state"),
                        current_environment=rp_application_row.get("canada_login_environment"),
                        target_environment=None,
                        promotion_status=(promotion_request.get("status") if promotion_request else None),
                        external_review_reference=(promotion_request.get("external_reference") if promotion_request else None),
                        last_activity_at=self._select_lifecycle_timestamp(
                            rp_application_row,
                            fallback=(promotion_request.get("updated_at") if promotion_request else None),
                        ),
                        detail_path=configuration_detail_path,
                    )
                )

            if promotion_request is None:
                continue

            queue_rows.append(
                self._build_queue_row(
                    record_type="production_progression",
                    record_uuid=rp_application_row["uuid"],
                    primary_record_label=configuration_label,
                    workspace_uuid=parent_workspace["uuid"],
                    workspace_name=parent_workspace["name"],
                    department=departments_by_id.get(department_id) if isinstance(department_id, int) else None,
                    onboarding_state=rp_application_row.get("onboarding_state"),
                    current_environment=rp_application_row.get("canada_login_environment"),
                    target_environment=promotion_request.get("target_environment"),
                    promotion_status=promotion_request.get("status"),
                    external_review_reference=promotion_request.get("external_reference"),
                    last_activity_at=self._select_promotion_timestamp(
                        promotion_request=promotion_request,
                        fallback=rp_application_row.get("updated_at"),
                    ),
                    detail_path=(f"{configuration_detail_path}/production-review" if parent_application is not None else configuration_detail_path),
                )
            )

        filtered_rows = [
            row
            for row in queue_rows
            if self._matches_filters(
                row=row,
                onboarding_state=onboarding_state,
                record_type=record_type,
                department=department,
                workspace=workspace,
                environment=environment,
                promotion_status=promotion_status,
            )
        ]
        filtered_rows.sort(key=self._sort_key)
        return filtered_rows

    async def _build_throughput_report(
        self,
        db: AsyncSession,
        *,
        start_date: date,
        end_date: date,
        group_by: OnboardingOversightReportGroupBy,
        workspace_id: int | None,
        workspace_uuid: UUID | None,
    ) -> dict[str, Any]:
        workspace_filter: dict[str, Any] = {"id": workspace_id} if workspace_id is not None else {}
        child_filter: dict[str, Any] = {"workspace_id": workspace_id} if workspace_id is not None else {}
        workspaces = await crud_workspaces.get_multi(
            db=db,
            is_deleted=False,
            schema_to_select=WorkspaceRead,
            **workspace_filter,
        )
        application_information_records = await crud_application_information.get_multi(
            db=db,
            is_deleted=False,
            schema_to_select=ApplicationInformationRead,
            **child_filter,
        )
        rp_applications = await crud_rp_applications.get_multi(
            db=db,
            is_deleted=False,
            schema_to_select=RPApplicationRead,
            **child_filter,
        )

        grouped_rows: dict[tuple[date, date, str], dict[str, Any]] = {}
        summary = {
            "submitted_count": 0,
            "approved_count": 0,
            "launched_count": 0,
        }

        for records in (
            workspaces.get("data", []),
            application_information_records.get("data", []),
            rp_applications.get("data", []),
        ):
            for record in records:
                for timestamp_key, summary_key in (
                    ("submitted_at", "submitted_count"),
                    ("approved_at", "approved_count"),
                    ("launched_at", "launched_count"),
                ):
                    timestamp = self._coerce_datetime(record.get(timestamp_key))
                    if timestamp is None:
                        continue
                    event_date = self._as_utc_date(timestamp)
                    if event_date < start_date or event_date > end_date:
                        continue

                    bucket_start, bucket_end, bucket_label = self._resolve_bucket(
                        event_date,
                        group_by,
                    )
                    row_key = (bucket_start, bucket_end, bucket_label)
                    row = grouped_rows.setdefault(
                        row_key,
                        {
                            "bucket_label": bucket_label,
                            "bucket_start": bucket_start,
                            "bucket_end": bucket_end,
                            "submitted_count": 0,
                            "approved_count": 0,
                            "launched_count": 0,
                        },
                    )
                    row[summary_key] += 1
                    summary[summary_key] += 1

        return self._build_report_response(
            metric="onboarding_throughput",
            title="Onboarding throughput",
            start_date=start_date,
            end_date=end_date,
            group_by=group_by,
            workspace_uuid=workspace_uuid,
            summary=OnboardingOversightReportSummaryRead(**summary),
            rows=self._sorted_report_rows(grouped_rows),
        )

    async def _build_invitation_conversion_report(
        self,
        db: AsyncSession,
        *,
        start_date: date,
        end_date: date,
        group_by: OnboardingOversightReportGroupBy,
        workspace_id: int | None,
        workspace_uuid: UUID | None,
    ) -> dict[str, Any]:
        workspace_filter: dict[str, Any] = {"workspace_id": workspace_id} if workspace_id is not None else {}
        invitations = await crud_rp_application_developer_invitations.get_multi(
            db=db,
            is_deleted=False,
            return_as_model=False,
            **workspace_filter,
        )

        grouped_rows: dict[tuple[date, date, str], dict[str, Any]] = {}
        invitations_sent = 0
        invitations_accepted = 0

        for invitation in invitations.get("data", []):
            created_at = self._coerce_datetime(invitation.get("created_at"))
            if created_at is None:
                continue
            created_date = self._as_utc_date(created_at)
            if created_date < start_date or created_date > end_date:
                continue

            bucket_start, bucket_end, bucket_label = self._resolve_bucket(
                created_date,
                group_by,
            )
            row_key = (bucket_start, bucket_end, bucket_label)
            row = grouped_rows.setdefault(
                row_key,
                {
                    "bucket_label": bucket_label,
                    "bucket_start": bucket_start,
                    "bucket_end": bucket_end,
                    "invitations_sent": 0,
                    "invitations_accepted": 0,
                },
            )
            row["invitations_sent"] += 1
            invitations_sent += 1

            accepted_at = self._coerce_datetime(invitation.get("accepted_at"))
            if accepted_at is not None and self._as_utc_date(accepted_at) <= end_date:
                row["invitations_accepted"] += 1
                invitations_accepted += 1

        rows = []
        for _, row in sorted(
            grouped_rows.items(),
            key=lambda item: (item[0][0], item[0][1]),
            reverse=True,
        ):
            row["conversion_rate"] = self._calculate_rate(
                row.get("invitations_accepted", 0),
                row.get("invitations_sent", 0),
            )
            rows.append(OnboardingOversightReportRowRead(**row).model_dump())

        return self._build_report_response(
            metric="invitation_conversion",
            title="Invitation conversion",
            start_date=start_date,
            end_date=end_date,
            group_by=group_by,
            workspace_uuid=workspace_uuid,
            summary=OnboardingOversightReportSummaryRead(
                invitations_sent=invitations_sent,
                invitations_accepted=invitations_accepted,
                conversion_rate=self._calculate_rate(
                    invitations_accepted,
                    invitations_sent,
                ),
            ),
            rows=rows,
        )

    async def _build_secret_rotation_hygiene_report(
        self,
        db: AsyncSession,
        *,
        start_date: date,
        end_date: date,
        workspace_id: int | None,
        workspace_uuid: UUID | None,
    ) -> dict[str, Any]:
        workspace_filter: dict[str, Any] = {"workspace_id": workspace_id} if workspace_id is not None else {}
        rp_applications = await crud_rp_applications.get_multi(
            db=db,
            is_deleted=False,
            return_as_model=False,
            schema_to_select=RPApplicationRead,
            **workspace_filter,
        )
        audit_logs = await crud_audit_log.get_multi(
            db=db,
            schema_to_select=AuditLogRead,
        )

        compliant_application_uuids: set[str] = set()
        for audit_log in audit_logs.get("data", []):
            if audit_log.get("target") != "rp_application":
                continue
            if audit_log.get("operation") not in SECRET_ROTATION_AUDIT_OPERATIONS:
                continue

            target_uuid = self._normalize_uuid(audit_log.get("target_uuid"))
            if target_uuid is None:
                continue

            created_at = self._coerce_datetime(audit_log.get("created_at"))
            if created_at is None:
                continue
            created_date = self._as_utc_date(created_at)
            if created_date < start_date or created_date > end_date:
                continue

            compliant_application_uuids.add(target_uuid)

        total_rp_applications = 0
        compliant_rp_applications = 0
        for rp_application in rp_applications.get("data", []):
            total_rp_applications += 1
            rp_application_uuid = self._normalize_uuid(rp_application.get("uuid"))
            if rp_application_uuid is not None and rp_application_uuid in compliant_application_uuids:
                compliant_rp_applications += 1

        non_compliant_rp_applications = max(
            total_rp_applications - compliant_rp_applications,
            0,
        )
        policy_window_days = (end_date - start_date).days + 1

        return self._build_report_response(
            metric="secret_rotation_hygiene",
            title="Secret rotation hygiene",
            start_date=start_date,
            end_date=end_date,
            group_by=None,
            workspace_uuid=workspace_uuid,
            policy_window_days=policy_window_days,
            summary=OnboardingOversightReportSummaryRead(
                total_rp_applications=total_rp_applications,
                compliant_rp_applications=compliant_rp_applications,
                non_compliant_rp_applications=non_compliant_rp_applications,
                hygiene_rate=self._calculate_rate(
                    compliant_rp_applications,
                    total_rp_applications,
                ),
                policy_window_days=policy_window_days,
            ),
            rows=[
                OnboardingOversightReportRowRead(
                    bucket_label=f"{start_date.isoformat()} to {end_date.isoformat()}",
                    bucket_start=start_date,
                    bucket_end=end_date,
                    total_rp_applications=total_rp_applications,
                    compliant_rp_applications=compliant_rp_applications,
                    non_compliant_rp_applications=non_compliant_rp_applications,
                    hygiene_rate=self._calculate_rate(
                        compliant_rp_applications,
                        total_rp_applications,
                    ),
                ).model_dump()
            ],
        )

    def _build_report_response(
        self,
        *,
        metric: OnboardingOversightReportMetric,
        title: str,
        start_date: date,
        end_date: date,
        group_by: OnboardingOversightReportGroupBy | None,
        workspace_uuid: UUID | None,
        summary: OnboardingOversightReportSummaryRead,
        rows: list[dict[str, Any]],
        policy_window_days: int | None = None,
    ) -> dict[str, Any]:
        return OnboardingOversightReportRead(
            metric=metric,
            title=title,
            generated_at=datetime.now(UTC),
            applied_filters=OnboardingOversightReportAppliedFiltersRead(
                metric=metric,
                start_date=start_date,
                end_date=end_date,
                group_by=group_by,
                workspace_uuid=workspace_uuid,
                policy_window_days=policy_window_days,
            ),
            summary=summary,
            rows=[OnboardingOversightReportRowRead(**row) for row in rows],
            export_available=True,
        ).model_dump()

    async def _list_departments_by_id(
        self,
        db: AsyncSession,
    ) -> dict[int, dict[str, Any]]:
        departments = await crud_departments.get_multi(
            db=db,
            is_deleted=False,
            schema_to_select=DepartmentRead,
        )
        return {department_row["id"]: department_row for department_row in departments.get("data", [])}

    async def _get_production_promotion_request(
        self,
        db: AsyncSession,
        rp_application: dict[str, Any],
    ) -> dict[str, Any] | None:
        if self._normalize_environment(rp_application.get("canada_login_environment")) != PRODUCTION_TARGET_ENVIRONMENT:
            return None

        rp_application_id = rp_application.get("id")
        if not isinstance(rp_application_id, int):
            return None

        return await crud_rp_application_promotion_requests.get(
            db=db,
            rp_application_id=rp_application_id,
            target_environment=PRODUCTION_TARGET_ENVIRONMENT,
            is_deleted=False,
        )

    def _build_queue_row(
        self,
        *,
        record_type: OnboardingOversightRecordType,
        record_uuid: Any,
        primary_record_label: Any,
        workspace_uuid: Any,
        workspace_name: Any,
        department: dict[str, Any] | None,
        onboarding_state: Any,
        current_environment: Any,
        target_environment: Any,
        promotion_status: Any,
        external_review_reference: Any,
        last_activity_at: Any,
        detail_path: str,
    ) -> dict[str, Any]:
        return OnboardingOversightQueueRowRead(
            record_type=record_type,
            record_uuid=record_uuid,
            primary_record_label=str(primary_record_label).strip(),
            workspace_uuid=workspace_uuid,
            workspace_name=str(workspace_name).strip(),
            department_uuid=department.get("uuid") if department else None,
            department_name=department.get("name") if department else None,
            onboarding_state=self._normalize_onboarding_state(onboarding_state),
            current_environment=self._normalize_environment(current_environment),
            target_environment=self._normalize_environment(target_environment),
            promotion_status=self._normalize_promotion_status(promotion_status),
            external_review_reference=self._normalize_optional_text(external_review_reference),
            last_activity_at=self._coerce_datetime(last_activity_at),
            detail_path=detail_path,
        ).model_dump()

    def _matches_filters(
        self,
        *,
        row: dict[str, Any],
        onboarding_state: OnboardingState | None,
        record_type: OnboardingOversightRecordType | None,
        department: str | None,
        workspace: str | None,
        environment: CanadaLoginEnvironment | None,
        promotion_status: PromotionRequestStatus | None,
    ) -> bool:
        if onboarding_state is not None and row.get("onboarding_state") != onboarding_state:
            return False
        if record_type is not None and row.get("record_type") != record_type:
            return False

        normalized_department_filter = self._normalize_filter_text(department)
        if normalized_department_filter is not None:
            department_name = self._normalize_filter_text(row.get("department_name"))
            if department_name is None or normalized_department_filter not in department_name:
                return False

        normalized_workspace_filter = self._normalize_filter_text(workspace)
        if normalized_workspace_filter is not None:
            workspace_name = self._normalize_filter_text(row.get("workspace_name"))
            if workspace_name is None or normalized_workspace_filter not in workspace_name:
                return False

        normalized_environment_filter = self._normalize_environment(environment)
        if normalized_environment_filter is not None:
            current_environment = self._normalize_environment(row.get("current_environment"))
            target_environment = self._normalize_environment(row.get("target_environment"))
            if current_environment != normalized_environment_filter and target_environment != normalized_environment_filter:
                return False

        normalized_promotion_status = self._normalize_promotion_status(promotion_status)
        if normalized_promotion_status is not None and row.get("promotion_status") != normalized_promotion_status:
            return False

        return True

    def _sort_key(self, row: dict[str, Any]) -> tuple[int, float, str, str]:
        normalized_state = self._normalize_onboarding_state(row.get("onboarding_state"))
        sort_priority = STATE_SORT_PRIORITY.get(normalized_state, 99)
        timestamp = self._coerce_datetime(row.get("last_activity_at"))
        timestamp_value = timestamp.timestamp() if timestamp is not None else 0.0
        return (
            sort_priority,
            -timestamp_value,
            str(row.get("workspace_name") or "").casefold(),
            str(row.get("primary_record_label") or "").casefold(),
        )

    def _sorted_report_rows(
        self,
        grouped_rows: dict[tuple[date, date, str], dict[str, Any]],
    ) -> list[dict[str, Any]]:
        return [
            OnboardingOversightReportRowRead(**row).model_dump()
            for _, row in sorted(
                grouped_rows.items(),
                key=lambda item: (item[0][0], item[0][1]),
                reverse=True,
            )
        ]

    def _serialize_report_csv(self, report: dict[str, Any]) -> str:
        output = StringIO()
        writer = csv.writer(output)
        metric = report["metric"]

        if metric == "onboarding_throughput":
            writer.writerow(
                [
                    "bucket_label",
                    "bucket_start",
                    "bucket_end",
                    "submitted_count",
                    "approved_count",
                    "launched_count",
                ]
            )
            for row in report.get("rows", []):
                writer.writerow(
                    [
                        row.get("bucket_label", ""),
                        row.get("bucket_start", ""),
                        row.get("bucket_end", ""),
                        row.get("submitted_count", 0),
                        row.get("approved_count", 0),
                        row.get("launched_count", 0),
                    ]
                )
        elif metric == "invitation_conversion":
            writer.writerow(
                [
                    "bucket_label",
                    "bucket_start",
                    "bucket_end",
                    "invitations_sent",
                    "invitations_accepted",
                    "conversion_rate",
                ]
            )
            for row in report.get("rows", []):
                writer.writerow(
                    [
                        row.get("bucket_label", ""),
                        row.get("bucket_start", ""),
                        row.get("bucket_end", ""),
                        row.get("invitations_sent", 0),
                        row.get("invitations_accepted", 0),
                        row.get("conversion_rate", 0),
                    ]
                )
        else:
            writer.writerow(
                [
                    "bucket_label",
                    "bucket_start",
                    "bucket_end",
                    "total_rp_applications",
                    "compliant_rp_applications",
                    "non_compliant_rp_applications",
                    "hygiene_rate",
                    "policy_window_days",
                ]
            )
            policy_window_days = report.get("summary", {}).get("policy_window_days")
            for row in report.get("rows", []):
                writer.writerow(
                    [
                        row.get("bucket_label", ""),
                        row.get("bucket_start", ""),
                        row.get("bucket_end", ""),
                        row.get("total_rp_applications", 0),
                        row.get("compliant_rp_applications", 0),
                        row.get("non_compliant_rp_applications", 0),
                        row.get("hygiene_rate", 0),
                        policy_window_days or "",
                    ]
                )

        return output.getvalue()

    def _is_visible_queue_state(self, state: Any) -> bool:
        return self._normalize_onboarding_state(state) in VISIBLE_QUEUE_STATES

    def _select_lifecycle_timestamp(
        self,
        record: dict[str, Any],
        *,
        fallback: Any = None,
    ) -> datetime | None:
        for field_name in (
            "under_review_at",
            "submitted_at",
            "approved_at",
            "launched_at",
            "updated_at",
            "created_at",
        ):
            coerced_value = self._coerce_datetime(record.get(field_name))
            if coerced_value is not None:
                return coerced_value
        return self._coerce_datetime(fallback)

    def _select_promotion_timestamp(
        self,
        *,
        promotion_request: dict[str, Any],
        fallback: Any = None,
    ) -> datetime | None:
        for field_name in ("reviewed_at", "requested_at", "updated_at", "created_at"):
            coerced_value = self._coerce_datetime(promotion_request.get(field_name))
            if coerced_value is not None:
                return coerced_value
        return self._coerce_datetime(fallback)

    def _parse_report_metric(self, metric: str) -> OnboardingOversightReportMetric:
        normalized_metric = self._normalize_optional_text(metric)
        if normalized_metric not in SUPPORTED_REPORT_METRICS:
            raise OnboardingReportRequestException(
                code="onboarding_report_unsupported_filter",
                message="Unsupported onboarding report metric.",
            )
        return cast(OnboardingOversightReportMetric, normalized_metric)

    def _parse_report_group_by(
        self,
        group_by: str | None,
    ) -> OnboardingOversightReportGroupBy | None:
        normalized_group_by = self._normalize_optional_text(group_by)
        if normalized_group_by is None:
            return None
        if normalized_group_by not in SUPPORTED_REPORT_GROUP_BY:
            raise OnboardingReportRequestException(
                code="onboarding_report_unsupported_filter",
                message="Unsupported onboarding report grouping.",
            )
        return cast(OnboardingOversightReportGroupBy, normalized_group_by)

    def _parse_report_date(self, value: str) -> date:
        normalized_value = self._normalize_optional_text(value)
        if normalized_value is None:
            raise OnboardingReportRequestException(
                code="onboarding_report_invalid_date_range",
                message="Report start and end dates are required.",
            )

        try:
            return date.fromisoformat(normalized_value)
        except ValueError as exc:
            raise OnboardingReportRequestException(
                code="onboarding_report_invalid_date_range",
                message="Report dates must use the YYYY-MM-DD format.",
            ) from exc

    def _resolve_bucket(
        self,
        value: date,
        group_by: OnboardingOversightReportGroupBy,
    ) -> tuple[date, date, str]:
        if group_by == "day":
            return value, value, value.isoformat()

        if group_by == "week":
            bucket_start = value - timedelta(days=value.weekday())
            bucket_end = bucket_start + timedelta(days=6)
            return (
                bucket_start,
                bucket_end,
                f"{bucket_start.isoformat()} to {bucket_end.isoformat()}",
            )

        bucket_start = value.replace(day=1)
        bucket_end = value.replace(day=monthrange(value.year, value.month)[1])
        return bucket_start, bucket_end, bucket_start.strftime("%Y-%m")

    def _calculate_rate(self, numerator: int, denominator: int) -> float:
        if denominator <= 0:
            return 0.0
        return round((numerator / denominator) * 100, 1)

    def _normalize_onboarding_state(self, state: Any) -> OnboardingState:
        normalized_state = str(state or "draft").strip().lower()
        if normalized_state in {"submitted", "under_review", "approved", "launched"}:
            return cast(OnboardingState, normalized_state)
        return "draft"

    def _normalize_environment(self, value: Any) -> CanadaLoginEnvironment | None:
        normalized_value = self._normalize_optional_text(value)
        if normalized_value in {"test", "staging", "production"}:
            return cast(CanadaLoginEnvironment, normalized_value)
        return None

    def _normalize_promotion_status(self, value: Any) -> PromotionRequestStatus | None:
        normalized_value = self._normalize_optional_text(value)
        if normalized_value in {
            "review_tracked",
            "changes_requested",
            "approved",
            "launched",
        }:
            return cast(PromotionRequestStatus, normalized_value)
        return None

    def _normalize_filter_text(self, value: Any) -> str | None:
        normalized_value = self._normalize_optional_text(value)
        if normalized_value is None:
            return None
        return normalized_value.casefold()

    def _normalize_optional_text(self, value: Any) -> str | None:
        normalized_value = str(value or "").strip()
        return normalized_value or None

    def _normalize_uuid(self, value: Any) -> str | None:
        if isinstance(value, UUID):
            return str(value)

        normalized_value = self._normalize_optional_text(value)
        if normalized_value is None:
            return None

        try:
            return str(UUID(normalized_value))
        except ValueError:
            return None

    def _as_utc_date(self, value: datetime) -> date:
        if value.tzinfo is None:
            return value.date()
        return value.astimezone(UTC).date()

    def _coerce_datetime(self, value: Any) -> datetime | None:
        if isinstance(value, datetime):
            return value
        if isinstance(value, str):
            normalized_value = value.strip()
            if not normalized_value:
                return None
            try:
                return datetime.fromisoformat(normalized_value.replace("Z", "+00:00"))
            except ValueError:
                return None
        return None
