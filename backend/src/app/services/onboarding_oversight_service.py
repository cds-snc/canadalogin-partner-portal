from datetime import UTC, datetime
from typing import Any, cast

from sqlalchemy.ext.asyncio import AsyncSession

from ..repositories.crud_application_information import crud_application_information
from ..repositories.crud_departments import crud_departments
from ..repositories.crud_rp_application_promotion_requests import (
    crud_rp_application_promotion_requests,
)
from ..repositories.crud_rp_applications import crud_rp_applications
from ..repositories.crud_users import crud_users
from ..repositories.crud_workspaces import crud_workspaces
from ..schemas.application_information import ApplicationInformationRead
from ..schemas.department import DepartmentRead
from ..schemas.onboarding_oversight import ProductionReviewQueueRowRead
from ..schemas.rp_application_promotion_request import ProductionReviewStatus
from ..schemas.workspace import WorkspaceRead

PRODUCTION_TARGET_ENVIRONMENT = "production"
REVIEW_STATUS_SORT_PRIORITY: dict[ProductionReviewStatus, int] = {
    "pending": 0,
    "approved": 1,
    "rejected": 2,
}


class OnboardingOversightService:
    """Provide the retained CL Admin anchor's explicit Production-review list."""

    async def list_queue(
        self,
        db: AsyncSession,
        *,
        review_status: ProductionReviewStatus | None = None,
        department: str | None = None,
        workspace: str | None = None,
    ) -> list[dict[str, Any]]:
        departments_by_id = await self._list_departments_by_id(db=db)

        workspaces = await crud_workspaces.get_multi(
            db=db,
            limit=None,
            return_total_count=False,
            is_deleted=False,
            return_as_model=False,
            schema_to_select=WorkspaceRead,
        )
        workspace_rows = workspaces.get("data", [])
        workspaces_by_id = {row["id"]: row for row in workspace_rows}

        applications = await crud_application_information.get_multi(
            db=db,
            limit=None,
            return_total_count=False,
            is_deleted=False,
            return_as_model=False,
            schema_to_select=ApplicationInformationRead,
        )
        applications_by_id = {row["id"]: row for row in applications.get("data", [])}

        rp_applications = await crud_rp_applications.get_multi(
            db=db,
            limit=None,
            return_total_count=False,
            is_deleted=False,
            return_as_model=False,
        )
        rp_applications_by_id = {row["id"]: row for row in rp_applications.get("data", [])}

        review_records = await crud_rp_application_promotion_requests.get_multi(
            db=db,
            limit=None,
            return_total_count=False,
            target_environment=PRODUCTION_TARGET_ENVIRONMENT,
            is_deleted=False,
            return_as_model=False,
        )
        review_rows = review_records.get("data", [])
        reviewers_by_id = await self._load_reviewers_by_id(db=db, review_rows=review_rows)

        queue_rows: list[dict[str, Any]] = []
        for review in review_rows:
            canonical_status = self._normalize_review_status(review.get("review_status"))
            if canonical_status is None:
                # Retain ambiguous legacy rows without presenting them as a
                # canonical pending or terminal review.
                continue
            if review_status is not None and canonical_status != review_status:
                continue
            external_review_reference = self._normalize_optional_text(review.get("external_reference"))
            if external_review_reference is None:
                continue

            rp_application_id = review.get("rp_application_id")
            target = rp_applications_by_id.get(rp_application_id) if isinstance(rp_application_id, int) else None
            if target is None:
                continue
            if str(target.get("canada_login_environment") or "").strip().lower() != PRODUCTION_TARGET_ENVIRONMENT:
                continue

            application_id = target.get("application_information_id")
            application = applications_by_id.get(application_id) if isinstance(application_id, int) else None
            workspace_id = target.get("workspace_id")
            parent_workspace = workspaces_by_id.get(workspace_id) if isinstance(workspace_id, int) else None
            if application is None or parent_workspace is None:
                continue

            department_id = parent_workspace.get("department_id")
            department_row = departments_by_id.get(department_id) if isinstance(department_id, int) else None
            if not self._matches_text_filter(department, department_row.get("name") if department_row else None):
                continue
            if not self._matches_text_filter(workspace, parent_workspace.get("name")):
                continue

            requested_at = self._coerce_datetime(review.get("requested_at"))
            if requested_at is None:
                continue
            source_id = target.get("source_rp_configuration_id")
            source = rp_applications_by_id.get(source_id) if isinstance(source_id, int) else None
            reviewer_id = review.get("reviewed_by_user_id")
            reviewer = reviewers_by_id.get(reviewer_id) if isinstance(reviewer_id, int) else None

            queue_rows.append(
                ProductionReviewQueueRowRead(
                    rp_configuration_uuid=target["uuid"],
                    configuration_name=(target.get("configuration_name") or target.get("dnr_app_name") or "RP configuration"),
                    source_rp_configuration_uuid=source.get("uuid") if source else None,
                    application_information_uuid=application["uuid"],
                    application_name_en=application["service_name_en"],
                    application_name_fr=application["service_name_fr"],
                    workspace_uuid=parent_workspace["uuid"],
                    workspace_name=parent_workspace["name"],
                    department_uuid=department_row.get("uuid") if department_row else None,
                    department_name=department_row.get("name") if department_row else None,
                    review_status=canonical_status,
                    external_review_reference=external_review_reference,
                    reviewed_by_user_uuid=reviewer.get("uuid") if reviewer else None,
                    reviewed_by_team=self._normalize_optional_text(review.get("reviewed_by_team")),
                    requested_at=requested_at,
                    reviewed_at=self._coerce_datetime(review.get("reviewed_at")),
                    decided_at=self._coerce_datetime(review.get("decided_at")),
                    updated_at=self._coerce_datetime(review.get("updated_at")),
                    detail_path=(
                        f"/workspaces/{parent_workspace['uuid']}/applications/{application['uuid']}"
                        f"/rp-configurations/{target['uuid']}/production-review"
                    ),
                ).model_dump()
            )

        queue_rows.sort(key=self._sort_key)
        return queue_rows

    async def _list_departments_by_id(
        self,
        db: AsyncSession,
    ) -> dict[int, dict[str, Any]]:
        departments = await crud_departments.get_multi(
            db=db,
            limit=None,
            return_total_count=False,
            is_deleted=False,
            schema_to_select=DepartmentRead,
        )
        return {row["id"]: row for row in departments.get("data", [])}

    async def _load_reviewers_by_id(
        self,
        db: AsyncSession,
        review_rows: list[dict[str, Any]],
    ) -> dict[int, dict[str, Any]]:
        reviewer_ids = {reviewer_id for row in review_rows if isinstance((reviewer_id := row.get("reviewed_by_user_id")), int)}
        reviewers: dict[int, dict[str, Any]] = {}
        for reviewer_id in reviewer_ids:
            reviewer = await crud_users.get(db=db, id=reviewer_id, is_deleted=False)
            if reviewer is not None:
                reviewers[reviewer_id] = reviewer
        return reviewers

    def _sort_key(self, row: dict[str, Any]) -> tuple[int, float, str, str]:
        status = cast(ProductionReviewStatus, row["review_status"])
        activity = (
            self._coerce_datetime(row.get("decided_at"))
            or self._coerce_datetime(row.get("updated_at"))
            or self._coerce_datetime(row.get("requested_at"))
            or datetime.min.replace(tzinfo=UTC)
        )
        return (
            REVIEW_STATUS_SORT_PRIORITY[status],
            -activity.timestamp(),
            str(row.get("workspace_name") or "").casefold(),
            str(row.get("configuration_name") or "").casefold(),
        )

    @staticmethod
    def _normalize_review_status(value: Any) -> ProductionReviewStatus | None:
        normalized = str(value or "").strip().lower()
        if normalized in {"pending", "approved", "rejected"}:
            return cast(ProductionReviewStatus, normalized)
        return None

    def _matches_text_filter(self, requested: Any, candidate: Any) -> bool:
        requested_text = self._normalize_optional_text(requested)
        if requested_text is None:
            return True
        candidate_text = self._normalize_optional_text(candidate)
        return candidate_text is not None and requested_text.casefold() in candidate_text.casefold()

    @staticmethod
    def _normalize_optional_text(value: Any) -> str | None:
        normalized = str(value or "").strip()
        return normalized or None

    @staticmethod
    def _coerce_datetime(value: Any) -> datetime | None:
        if isinstance(value, datetime):
            return value
        if isinstance(value, str):
            normalized = value.strip()
            if not normalized:
                return None
            try:
                return datetime.fromisoformat(normalized.replace("Z", "+00:00"))
            except ValueError:
                return None
        return None
