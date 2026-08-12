import { useNavigate, useParams, useSearch } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import type { FunctionComponent } from "@/common/types";
import { AggregateReportsPageContent } from "@/features/onboarding-oversight/pages/OnboardingOversightReportsPage";
import { normalizeOnboardingOversightReportFilters } from "@/features/onboarding-oversight/report-filters";
import { useWorkspace } from "../hooks/use-workspace";

export const WorkspaceReportsPage = (): FunctionComponent => {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const { workspaceUuid } = useParams({
		from: "/workspaces/$workspaceUuid/reports",
	});
	const search = useSearch({ from: "/workspaces/$workspaceUuid/reports" });
	const filters = normalizeOnboardingOversightReportFilters(search);
	const { workspace } = useWorkspace(workspaceUuid);
	const workspaceName =
		workspace?.name.trim() || t("workspaces.workspaceLabel");

	return (
		<AggregateReportsPageContent
			accessNoticeBody={t("workspaces.reportsAccessNoticeBody")}
			accessNoticeTitle={t("workspaces.reportsAccessNoticeTitle")}
			filters={filters}
			pageTitle={t("workspaces.reportsPageTitle", { name: workspaceName })}
			returnHref={`/workspaces/${encodeURIComponent(workspaceUuid)}`}
			returnLabel={t("workspaces.reportsBackToHub")}
			summary={t("workspaces.reportsSummary")}
			workspaceUuid={workspaceUuid}
			onFilterSubmit={(nextFilters): void => {
				void navigate({
					params: { workspaceUuid },
					search: normalizeOnboardingOversightReportFilters(nextFilters),
					to: "/workspaces/$workspaceUuid/reports",
				});
			}}
		/>
	);
};
