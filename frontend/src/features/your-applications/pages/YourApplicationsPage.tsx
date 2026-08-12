import { useTranslation } from "react-i18next";
import type { FunctionComponent } from "@/common/types";
import { useDocumentTitle } from "@/common/use-document-title";
import { Button, Card, Heading, Link, Notice, Text } from "@/components/ui";
import { getRequestErrorNotice } from "@/fetch";
import { getAccessibleRPApplications } from "@/fetch/rp-applications";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "@/hooks";
import { useWorkspaces } from "@/features/workspaces/hooks/use-workspaces";
import { accessibleRPApplicationsQueryKey } from "@/features/your-applications/query-keys";
import { RPApplicationSummaryCard } from "@/features/rp-applications/components/RPApplicationSummaryCard";

const DashboardSection = ({
	children,
	title,
}: {
	children: React.ReactNode;
	title: string;
}): FunctionComponent => (
	<section className="grid gap-200 rounded-md border border-[var(--gcds-border-default)] bg-[var(--gcds-bg-light)] p-300">
		<Heading marginBottom="200" marginTop="0" tag="h2">
			{title}
		</Heading>
		{children}
	</section>
);

export const YourApplicationsPage = (): FunctionComponent => {
	const { t } = useTranslation();
	const { currentUser, isLoading: isSessionLoading } = useSession();
	const {
		error: workspacesError,
		isLoading: isWorkspacesLoading,
		refetch: refetchWorkspaces,
		workspaces,
	} = useWorkspaces();
	const {
		data: rpApplications,
		error: applicationsError,
		isLoading: isApplicationsLoading,
		refetch: refetchApplications,
	} = useQuery({
		enabled: Boolean(currentUser?.uuid),
		queryFn: getAccessibleRPApplications,
		queryKey: accessibleRPApplicationsQueryKey,
	});
	const applicationsErrorNotice = getRequestErrorNotice(applicationsError, {
		bodyKey: "yourApplications.errorBody",
		titleKey: "yourApplications.errorTitle",
	});
	const workspacesErrorNotice = getRequestErrorNotice(workspacesError, {
		bodyKey: "yourApplications.workspacesErrorBody",
		titleKey: "yourApplications.workspacesErrorTitle",
	});
	useDocumentTitle(t("yourApplications.title"), t("home.title"));

	if (isSessionLoading) {
		return (
			<>
				<Heading tag="h1">{t("yourApplications.title")}</Heading>
				<Notice
					noticeRole="info"
					noticeTitle={t("yourApplications.loadingTitle")}
					noticeTitleTag="h2"
				>
					<Text>{t("yourApplications.loadingBody")}</Text>
				</Notice>
			</>
		);
	}

	return (
		<div className="grid gap-400">
			<Heading tag="h1">{t("yourApplications.title")}</Heading>
			<Text>{t("yourApplications.summary")}</Text>

			{currentUser ? (
				<>
					<DashboardSection
						title={t("yourApplications.applicationsSectionTitle")}
					>
						{isApplicationsLoading ? (
							<Notice
								noticeRole="info"
								noticeTitle={t("yourApplications.loadingTitle")}
								noticeTitleTag="h3"
							>
								<Text>{t("yourApplications.loadingBody")}</Text>
							</Notice>
						) : applicationsErrorNotice ? (
							<Notice
								noticeRole={applicationsErrorNotice.noticeRole}
								noticeTitle={t(applicationsErrorNotice.titleKey as never)}
								noticeTitleTag="h3"
							>
								<Text>
									{applicationsErrorNotice.bodyText ??
										t(applicationsErrorNotice.bodyKey as never)}
								</Text>
								<Button
									buttonRole="secondary"
									type="button"
									onGcdsClick={() => void refetchApplications()}
								>
									{t("yourApplications.retryApplications")}
								</Button>
							</Notice>
						) : (rpApplications ?? []).length > 0 ? (
							<div className="flex flex-col gap-200">
								{(rpApplications ?? []).map((application) => (
									<RPApplicationSummaryCard
										key={application.uuid}
										showWorkspaceContext
										application={application}
									/>
								))}
							</div>
						) : (
							<Text>{t("yourApplications.noRPApplications")}</Text>
						)}
					</DashboardSection>

					<DashboardSection
						title={t("yourApplications.workspacesSectionTitle")}
					>
						{isWorkspacesLoading ? (
							<Notice
								noticeRole="info"
								noticeTitle={t("yourApplications.workspacesLoadingTitle")}
								noticeTitleTag="h3"
							>
								<Text>{t("yourApplications.workspacesLoadingBody")}</Text>
							</Notice>
						) : workspacesErrorNotice ? (
							<Notice
								noticeRole={workspacesErrorNotice.noticeRole}
								noticeTitle={t(workspacesErrorNotice.titleKey as never)}
								noticeTitleTag="h3"
							>
								<Text>
									{workspacesErrorNotice.bodyText ??
										t(workspacesErrorNotice.bodyKey as never)}
								</Text>
								<Button
									buttonRole="secondary"
									type="button"
									onGcdsClick={() => void refetchWorkspaces()}
								>
									{t("yourApplications.retryWorkspaces")}
								</Button>
							</Notice>
						) : workspaces.length > 0 ? (
							<div className="grid gap-200">
								<div className="flex flex-col gap-200">
									{workspaces.map((workspace) => (
										<Card
											key={workspace.uuid}
											cardTitle={workspace.name}
											cardTitleTag="h3"
											description={workspace.description ?? workspace.slug}
											href={`/workspaces/${workspace.uuid}`}
										/>
									))}
								</div>
								<Link href="/workspaces">
									{t("yourApplications.viewAllWorkspaces")}
								</Link>
							</div>
						) : (
							<Text>{t("yourApplications.noWorkspaces")}</Text>
						)}
					</DashboardSection>
				</>
			) : null}
		</div>
	);
};
