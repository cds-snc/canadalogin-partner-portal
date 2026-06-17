import type { ReactElement, ReactNode } from "react";
import { useTranslation } from "react-i18next";
import type { FunctionComponent } from "@/common/types";
import { Container, Grid, Heading, Link, Notice, Text } from "@/components/ui";
import { getRequestErrorNotice } from "@/fetch";
import { getDepartment } from "@/fetch/departments";
import {
	getCurrentUserRPApplications,
	type CurrentUserRPApplicationRead,
} from "@/fetch/rp-applications";
import { useQuery } from "@tanstack/react-query";
import { useRoles, useSession } from "@/hooks";

type LabelValueRowProps = {
	label: string;
	value: ReactNode;
};

const LabelValueRow = ({ label, value }: LabelValueRowProps): ReactNode => (
	<div className="mb-300 last:mb-0">
		<Text marginBottom="0">
			<strong>{label}:</strong>
		</Text>
		<div>{value}</div>
	</div>
);

export const DashboardPage = (): FunctionComponent => {
	const { t } = useTranslation();
	const { currentUser, isLoading: isSessionLoading } = useSession();
	const {
		error: rolesError,
		isLoading: isRolesLoading,
		roles,
	} = useRoles(1, 1000);
	const {
		data: department,
		error: departmentError,
		isLoading: isDepartmentLoading,
	} = useQuery({
		enabled: Boolean(currentUser?.departmentUuid),
		queryFn: () =>
			currentUser?.departmentUuid
				? getDepartment(currentUser.departmentUuid)
				: null,
		queryKey: ["dashboard-department", currentUser?.departmentUuid],
	});
	const {
		data: rpApplications,
		error: applicationsError,
		isLoading: isApplicationsLoading,
	} = useQuery({
		enabled: Boolean(currentUser?.uuid),
		queryFn: getCurrentUserRPApplications,
		queryKey: ["dashboard-rp-applications"],
	});
	const isLoading =
		isSessionLoading ||
		isDepartmentLoading ||
		isRolesLoading ||
		isApplicationsLoading;
	const errorNotice = getRequestErrorNotice(
		departmentError ?? rolesError ?? applicationsError,
		{
			bodyKey: "dashboard.errorBody",
			titleKey: "dashboard.errorTitle",
		}
	);
	const roleNames = (currentUser?.roleUuids ?? [])
		.map(
			(roleUuid) =>
				roles.find((role) => role.uuid === roleUuid)?.name ?? roleUuid
		)
		.filter((roleName) => roleName.trim().length > 0);
	const departmentLabel = department
		? department.abbreviation
			? `${department.abbreviation} - ${department.name}`
			: department.name
		: (currentUser?.departmentAbbreviation ?? t("dashboard.noDepartment"));
	const renderApplicationLink = (
		application: CurrentUserRPApplicationRead
	): ReactElement => {
		const applicationLabel =
			application.dnrAppName?.trim() ||
			application.name?.trim() ||
			application.ibm_sv_application_id ||
			t("dashboard.rpApplicationsListTitle");

		return (
			<div className="flex items-center gap-200">
				<Link href={`/rp-applications/mine/${application.uuid}`}>
					{applicationLabel}
				</Link>
			</div>
		);
	};

	return (
		<section>
			<div className="max-w-3xl">
				<Heading tag="h1">{t("dashboard.title")}</Heading>
				<Text>{t("dashboard.summary")}</Text>
			</div>

			{isLoading ? (
				<Notice
					noticeRole="info"
					noticeTitle={t("dashboard.loadingTitle")}
					noticeTitleTag="h2"
				>
					<Text>{t("dashboard.loadingBody")}</Text>
				</Notice>
			) : null}

			{errorNotice ? (
				<Notice
					noticeRole={errorNotice.noticeRole}
					noticeTitle={t(errorNotice.titleKey as never)}
					noticeTitleTag="h2"
				>
					<Text>{errorNotice.bodyText ?? t(errorNotice.bodyKey as never)}</Text>
				</Notice>
			) : null}

			{currentUser ? (
				<>
					<Grid
						columns="1fr"
						columnsDesktop="minmax(0,1.4fr) 360px"
						tag="section"
					>
						<Container
							border
							id="dashboard-rp-applications"
							padding="300"
							tag="section"
						>
							<Heading marginTop="0" tag="h3">
								{t("dashboard.rpApplicationsListTitle")}
							</Heading>
							{(rpApplications ?? []).length > 0 ? (
								<ul className="mt-150 flex flex-col gap-100">
									{(rpApplications ?? []).map((application) => (
										<li key={application.uuid}>
											{renderApplicationLink(application)}
										</li>
									))}
								</ul>
							) : (
								<Text>{t("dashboard.noRPApplications")}</Text>
							)}
						</Container>

						<Container border id="dashboard-profile" padding="300" tag="aside">
							<Heading marginTop="0" tag="h3">
								{t("dashboard.profileEyebrow")}
							</Heading>
							<div className="mt-150">
								<LabelValueRow
									label={t("dashboard.name")}
									value={<Text marginBottom="0">{currentUser.name}</Text>}
								/>
								<LabelValueRow
									label={t("dashboard.email")}
									value={<Text marginBottom="0">{currentUser.email}</Text>}
								/>
								<LabelValueRow
									label={t("dashboard.department")}
									value={<Text marginBottom="0">{departmentLabel}</Text>}
								/>
								<LabelValueRow
									label={t("dashboard.roles")}
									value={
										roleNames.length > 0 ? (
											<ul className="flex flex-wrap gap-100">
												{roleNames.map((roleName) => (
													<li
														key={roleName}
														className="rounded-full border border-[var(--gcds-border-default)] bg-[rgba(255,255,255,0.88)] px-200 py-100 text-sm text-[var(--gcds-text-primary)]"
													>
														{roleName}
													</li>
												))}
											</ul>
										) : (
											<Text marginBottom="0">{t("dashboard.noRoles")}</Text>
										)
									}
								/>
							</div>
						</Container>
					</Grid>
				</>
			) : null}
		</section>
	);
};
