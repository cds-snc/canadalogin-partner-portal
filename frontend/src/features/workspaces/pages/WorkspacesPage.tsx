import { useNavigate, useSearch } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import type { FunctionComponent } from "@/common/types";
import { useDocumentTitle } from "@/common/use-document-title";
import { Button, DataTable, Heading, Notice, Text } from "@/components/ui";
import type { DataTableColumn } from "@/components/ui/DataTable";
import { getRequestErrorNotice } from "@/fetch";
import { hasCapability } from "@/features/auth/authorization";
import { useSession } from "@/hooks";
import { useWorkspaces } from "../hooks/use-workspaces";
import { getWorkspaceOnboardingStateLabel } from "../onboarding-display";

type WorkspaceTableRow = {
	name: string;
	onboardingState: string;
	slug: string;
	uuid: string;
};

export const WorkspacesPage = (): FunctionComponent => {
	const { t } = useTranslation() as unknown as {
		t: (
			key: string | Array<string>,
			options?: Record<string, unknown>
		) => string;
	};
	useDocumentTitle(t("workspaces.title"), t("home.title"));
	const navigate = useNavigate();
	const { currentUser } = useSession();
	const search = useSearch({ from: "/workspaces" });
	const { error, isLoading, workspaces } = useWorkspaces();
	const errorNotice = getRequestErrorNotice(error, {
		bodyKey: "workspaces.errorBody",
		titleKey: "workspaces.errorTitle",
	});
	const successMessage =
		search.deleted === "1" ? t("workspaces.deletedSuccess") : null;
	const canCreateWorkspace = hasCapability(
		currentUser?.authorizationContext,
		"partner_bootstrap"
	);
	const canAdoptRPRegistrations = canCreateWorkspace;
	const rows: Array<WorkspaceTableRow> = workspaces.map((workspace) => ({
		name: workspace.name,
		onboardingState: workspace.onboardingState?.trim()
			? getWorkspaceOnboardingStateLabel(t, workspace.onboardingState)
			: t("common.notAvailable"),
		slug: workspace.slug,
		uuid: workspace.uuid,
	}));
	const columns: Array<DataTableColumn<WorkspaceTableRow>> = [
		{ field: "name", headerName: t("workspaces.nameLabel") },
		{
			field: "onboardingState",
			headerName: t("workspaces.onboardingStateColumn"),
		},
		{ field: "slug", headerName: t("workspaces.slugLabel") },
	];

	return (
		<>
			<Heading tag="h1">{t("workspaces.title")}</Heading>
			<Text>{t("workspaces.summary")}</Text>

			{canAdoptRPRegistrations ? (
				<div className="mb-500 grid gap-100">
					<Heading tag="h2">{t("workspaces.clAdminTasksTitle")}</Heading>
					<Text>{t("workspaces.rpAdoptionTaskDescription")}</Text>
					<div>
						<Button
							buttonRole="secondary"
							href="/workspaces/rp-registration-adoption"
							type="link"
						>
							{t("workspaces.rpAdoptionTaskAction")}
						</Button>
					</div>
				</div>
			) : null}

			{successMessage ? (
				<Notice
					noticeRole="success"
					noticeTitle={successMessage}
					noticeTitleTag="h2"
				>
					<Text>{successMessage}</Text>
				</Notice>
			) : null}

			{isLoading ? (
				<Notice
					noticeRole="info"
					noticeTitle={t("workspaces.loadingTitle")}
					noticeTitleTag="h2"
				>
					<Text>{t("workspaces.loadingBody")}</Text>
				</Notice>
			) : null}

			{errorNotice ? (
				<Notice
					noticeRole={errorNotice.noticeRole}
					noticeTitle={t(errorNotice.titleKey)}
					noticeTitleTag="h2"
				>
					<Text>{errorNotice.bodyText ?? t(errorNotice.bodyKey)}</Text>
				</Notice>
			) : null}

			{!isLoading && !error && workspaces.length === 0 ? (
				<Notice
					noticeRole="warning"
					noticeTitle={t("workspaces.emptyTitle")}
					noticeTitleTag="h2"
				>
					<Text>{t("workspaces.emptyBody")}</Text>
					{canCreateWorkspace ? (
						<div className="mt-200">
							<Button href="/workspaces/new" type="link">
								{t("workspaces.createAction")}
							</Button>
						</div>
					) : null}
				</Notice>
			) : null}

			{workspaces.length > 0 ? (
				<div className="grid gap-300">
					<DataTable
						columns={columns}
						itemLabel={t("workspaces.itemLabel")}
						rows={rows}
						title={t("workspaces.title")}
						action={{
							buttonLabel: t("workspaces.viewAction"),
							onAction: (row): void => {
								void navigate({
									params: { workspaceUuid: row.uuid },
									to: "/workspaces/$workspaceUuid",
								});
							},
							screenReaderLabel: (row): string => row.name,
						}}
						primaryAction={
							canCreateWorkspace
								? {
										buttonLabel: t("workspaces.createAction"),
										onAction: (): void => {
											void navigate({ to: "/workspaces/new" });
										},
									}
								: undefined
						}
					/>
				</div>
			) : null}
		</>
	);
};
