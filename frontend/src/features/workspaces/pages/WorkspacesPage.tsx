import { useNavigate, useSearch } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import type { FunctionComponent } from "@/common/types";
import { Button, DataTable, Heading, Notice, Text } from "@/components/ui";
import type { DataTableColumn } from "@/components/ui/DataTable";
import { getRequestErrorNotice } from "@/fetch";
import { useWorkspaces } from "../hooks/use-workspaces";

type WorkspaceTableRow = {
	name: string;
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
	const navigate = useNavigate();
	const search = useSearch({ from: "/workspaces" });
	const { error, isLoading, workspaces } = useWorkspaces();
	const errorNotice = getRequestErrorNotice(error, {
		bodyKey: "workspaces.errorBody",
		titleKey: "workspaces.errorTitle",
	});
	const successMessage =
		search.deleted === "1" ? t("workspaces.deletedSuccess") : null;
	const rows: Array<WorkspaceTableRow> = workspaces.map((workspace) => ({
		name: workspace.name,
		slug: workspace.slug,
		uuid: workspace.uuid,
	}));
	const columns: Array<DataTableColumn<WorkspaceTableRow>> = [
		{ field: "name", headerName: t("workspaces.nameLabel") },
		{ field: "slug", headerName: t("workspaces.slugLabel") },
	];

	return (
		<>
			<Heading tag="h1">{t("workspaces.title")}</Heading>
			<Text>{t("workspaces.summary")}</Text>

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
					<div className="mt-200">
						<Button href="/workspaces/new" type="link">
							{t("workspaces.createAction")}
						</Button>
					</div>
				</Notice>
			) : null}

			{workspaces.length > 0 ? (
				<div className="grid gap-300">
					<DataTable
						columns={columns}
						getRowId={(row): string => row.uuid}
						itemLabel="workspaces"
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
						primaryAction={{
							buttonLabel: t("workspaces.createAction"),
							onAction: (): void => {
								void navigate({ to: "/workspaces/new" });
							},
						}}
					/>
				</div>
			) : null}
		</>
	);
};