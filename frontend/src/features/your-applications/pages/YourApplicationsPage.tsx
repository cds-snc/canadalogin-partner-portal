import { useTranslation } from "react-i18next";
import type { FunctionComponent } from "@/common/types";
import { Card, Grid, Heading, Link, Notice, Text } from "@/components/ui";
import { getDepartment } from "@/fetch/departments";
import { getRequestErrorNotice } from "@/fetch";
import { getCurrentUserRPApplications } from "@/fetch/rp-applications";
import { useQuery } from "@tanstack/react-query";
import { useRoles, useSession } from "@/hooks";
import { useWorkspaces } from "@/features/workspaces/hooks/use-workspaces";
import type { CurrentUserRPApplicationRead } from "@/fetch/rp-applications";

const getCurrentUserRPApplicationTitle = (
	application: {
		dnrAppName?: string;
		ibm_sv_application_id?: string | null;
		name?: string;
	}
): string | null =>
	application.dnrAppName?.trim() ||
	application.name?.trim() ||
	application.ibm_sv_application_id?.trim() ||
	null;

const formatTokenLabel = (value: string): string =>
	value
		.trim()
		.replace(/_/g, " ")
		.replace(/\s+/g, " ");

const getEnvironmentLabel = (
	t: (key: string) => string,
	environment: string
): string => {
	switch (environment.trim().toLowerCase()) {
		case "test":
			return t("yourApplications.environmentTest");
		case "staging":
			return t("yourApplications.environmentStaging");
		case "production":
			return t("yourApplications.environmentProduction");
		default:
			return formatTokenLabel(environment);
	}
};

const getOnboardingStateLabel = (
	t: (key: string) => string,
	state: string
): string => {
	switch (state.trim().toLowerCase()) {
		case "draft":
			return t("yourApplications.onboardingStateDraft");
		case "submitted":
			return t("yourApplications.onboardingStateSubmitted");
		case "under_review":
			return t("yourApplications.onboardingStateUnderReview");
		case "approved":
			return t("yourApplications.onboardingStateApproved");
		case "launched":
			return t("yourApplications.onboardingStateLaunched");
		default:
			return formatTokenLabel(state);
	}
};

const getPromotionStatusLabel = (
	t: (key: string) => string,
	status: string
): string => {
	switch (status.trim().toLowerCase()) {
		case "review_tracked":
			return t("yourApplications.promotionStatusReviewTracked");
		case "changes_requested":
			return t("yourApplications.promotionStatusChangesRequested");
		case "approved":
			return t("yourApplications.promotionStatusApproved");
		case "launched":
			return t("yourApplications.promotionStatusLaunched");
		default:
			return formatTokenLabel(status);
	}
};

const getCurrentUserRPApplicationSummary = (
	application: CurrentUserRPApplicationRead,
	t: (key: string) => string
): string => {
	const segments: Array<string> = [];
	const environment = application.canadaLoginEnvironment?.trim();
	const onboardingState = application.onboardingState?.trim();
	const promotionStatus = application.promotionStatus?.trim();

	if (environment) {
		segments.push(
			`${t("yourApplications.environmentLabel")}: ${getEnvironmentLabel(t, environment)}`
		);
	}
	if (onboardingState) {
		segments.push(
			`${t("yourApplications.onboardingStateLabel")}: ${getOnboardingStateLabel(t, onboardingState)}`
		);
	}
	if (promotionStatus) {
		segments.push(
			`${t("yourApplications.productionReviewLabel")}: ${getPromotionStatusLabel(t, promotionStatus)}`
		);
	}

	if (segments.length === 0) {
		return t("yourApplications.lifecycleUnavailable");
	}

	return segments.join(". ");
};

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
	const { isLoading: isRolesLoading, roles } = useRoles(1, 1000);
	const { error: workspacesError, isLoading: isWorkspacesLoading, workspaces } =
		useWorkspaces();
	const { data: department } = useQuery({
		enabled: Boolean(currentUser?.departmentUuid),
		queryFn: () =>
			currentUser?.departmentUuid
				? getDepartment(currentUser.departmentUuid)
				: null,
		queryKey: ["your-applications-department", currentUser?.departmentUuid],
	});
	const {
		data: rpApplications,
		error: applicationsError,
		isLoading: isApplicationsLoading,
	} = useQuery({
		enabled: Boolean(currentUser?.uuid),
		queryFn: getCurrentUserRPApplications,
		queryKey: ["your-applications-rp-applications"],
	});
	const applicationsErrorNotice = getRequestErrorNotice(applicationsError, {
		bodyKey: "yourApplications.errorBody",
		titleKey: "yourApplications.errorTitle",
	});
	const workspacesErrorNotice = getRequestErrorNotice(workspacesError, {
		bodyKey: "yourApplications.workspacesErrorBody",
		titleKey: "yourApplications.workspacesErrorTitle",
	});
	const departmentLabel =
		department?.name ??
		currentUser?.departmentAbbreviation ??
		t("yourApplications.noDepartment");
	const currentUserRoleUuids = currentUser?.roleUuids ?? [];
	const roleNames = currentUserRoleUuids
		.map((uuid) => roles.find((role) => role.uuid === uuid)?.name)
		.filter(
			(name): name is string => typeof name === "string" && name.trim().length > 0
		);

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
					<Grid columns="1fr" columnsDesktop="repeat(2, minmax(0, 1fr))" tag="div">
						<DashboardSection title={t("yourApplications.profileSectionTitle")}>
							<Text>{`${t("yourApplications.nameLabel")}: ${currentUser.name}`}</Text>
							<Text>{`${t("yourApplications.emailLabel")}: ${currentUser.email}`}</Text>
							<Text>{`${t("nav.organization")}: ${departmentLabel}`}</Text>
							{roleNames.length > 0 ? (
								<div className="grid gap-100">
									<Text>{`${t("nav.roles")}:`}</Text>
									<ul
										aria-label={t("nav.roles")}
										className="flex flex-wrap gap-100"
									>
										{roleNames.map((roleName) => (
											<li
												key={roleName}
												className="rounded-full border border-[var(--gcds-border-default)] bg-white px-200 py-100 text-xs text-[var(--gcds-text-primary)]"
											>
												{roleName}
											</li>
										))}
									</ul>
								</div>
							) : currentUserRoleUuids.length > 0 && isRolesLoading ? (
								<Text>{t("yourApplications.rolesLoading")}</Text>
							) : currentUserRoleUuids.length > 0 ? (
								<Text>{t("yourApplications.roleContextUnavailable")}</Text>
							) : (
								<Text>{t("yourApplications.noRoles")}</Text>
							)}
						</DashboardSection>

						<DashboardSection title={t("yourApplications.workspacesSectionTitle")}>
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
									<Link href="/workspaces">{t("yourApplications.viewAllWorkspaces")}</Link>
								</div>
							) : (
								<Text>{t("yourApplications.noWorkspaces")}</Text>
							)}
						</DashboardSection>
					</Grid>

					<DashboardSection title={t("yourApplications.applicationsSectionTitle")}>
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
							</Notice>
						) : (rpApplications ?? []).length > 0 ? (
							<div className="flex flex-col gap-200">
								{(rpApplications ?? []).map((application) => (
									<Card
										key={application.uuid}
										cardTitleTag="h3"
										description={getCurrentUserRPApplicationSummary(application, t)}
										href={`/your-applications/${application.uuid}`}
										cardTitle={
											getCurrentUserRPApplicationTitle(application) ??
											t("yourApplications.unknownApplication")
										}
									/>
								))}
							</div>
						) : (
							<Text>{t("yourApplications.noRPApplications")}</Text>
						)}
					</DashboardSection>
				</>
			) : null}
		</div>
	);
};
