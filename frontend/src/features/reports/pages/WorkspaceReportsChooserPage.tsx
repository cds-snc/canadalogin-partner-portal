import { useTranslation } from "react-i18next";
import type { FunctionComponent } from "@/common/types";
import { useDocumentTitle } from "@/common/use-document-title";
import { Button, Heading, Link, Notice, Text } from "@/components/ui";
import { hasCapability } from "@/features/auth/authorization";
import { useWorkspaces } from "@/features/workspaces/hooks/use-workspaces";
import { getRequestErrorNotice } from "@/fetch";
import { useSession } from "@/hooks";

export const WorkspaceReportsChooserPage = (): FunctionComponent => {
	const { t } = useTranslation();
	const { currentUser } = useSession();
	const { error, isLoading, refetch, workspaces } = useWorkspaces();
	useDocumentTitle(t("reports.workspacesChooser.title"), t("home.title"));
	const reportWorkspaces = workspaces.filter((workspace) =>
		hasCapability(
			currentUser?.authorizationContext,
			"aggregate_report_read",
			workspace.uuid
		)
	);
	const errorNotice = getRequestErrorNotice(error, {
		bodyKey: "reports.workspacesChooser.errorBody",
		titleKey: "reports.workspacesChooser.errorTitle",
	});

	return (
		<div className="grid gap-400">
			<div>
				<Heading tag="h1">{t("reports.workspacesChooser.title")}</Heading>
				<Text>{t("reports.workspacesChooser.summary")}</Text>
			</div>

			{isLoading ? (
				<Notice
					noticeRole="info"
					noticeTitle={t("reports.workspacesChooser.loadingTitle")}
					noticeTitleTag="h2"
				>
					<Text>{t("reports.workspacesChooser.loadingBody")}</Text>
				</Notice>
			) : errorNotice ? (
				<Notice
					noticeRole={errorNotice.noticeRole}
					noticeTitle={t(errorNotice.titleKey as never)}
					noticeTitleTag="h2"
				>
					<Text>{errorNotice.bodyText ?? t(errorNotice.bodyKey as never)}</Text>
					<Button
						buttonRole="secondary"
						type="button"
						onGcdsClick={() => void refetch()}
					>
						{t("reports.workspacesChooser.retryAction")}
					</Button>
				</Notice>
			) : reportWorkspaces.length === 0 ? (
				<Notice
					noticeRole="info"
					noticeTitle={t("reports.workspacesChooser.emptyTitle")}
					noticeTitleTag="h2"
				>
					<Text>{t("reports.workspacesChooser.emptyBody")}</Text>
				</Notice>
			) : (
				<ul className="space-y-400">
					{reportWorkspaces.map((workspace) => (
						<li key={workspace.uuid}>
							<Heading tag="h2">
								<Link
									href={`/workspaces/${encodeURIComponent(workspace.uuid)}/reports`}
								>
									{workspace.name.trim() ||
										t("reports.workspacesChooser.unknownWorkspace")}
								</Link>
							</Heading>
							{workspace.description?.trim() ? (
								<Text>{workspace.description}</Text>
							) : null}
						</li>
					))}
				</ul>
			)}

			<Link href="/reports">{t("reports.backToHub")}</Link>
		</div>
	);
};
