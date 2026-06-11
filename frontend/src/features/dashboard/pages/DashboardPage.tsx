import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import type { FunctionComponent } from "@/common/types";
import { Breadcrumbs, CenteredPageLayout } from "@/components/layout";
import { Heading, Link, Notice, Text } from "@/components/ui";
import { getRequestErrorNotice } from "@/fetch";
import { getDepartment } from "@/fetch/departments";
import {
	getCurrentUserRPApplications,
	type CurrentUserRPApplicationRead,
} from "@/fetch/workspaces";
import { useQuery } from "@tanstack/react-query";
import { useRoles, useSession } from "@/hooks";

const summaryCardClasses =
	"rounded-sm border border-[var(--gcds-border-default)] bg-[var(--gcds-bg-white)] px-400 py-350 shadow-[0_14px_28px_rgba(38,55,74,0.06)]";

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
			<Link href={`/rp-applications/mine/${application.uuid}`}>
				{applicationLabel}
			</Link>
		);
	};

	return (
		<CenteredPageLayout className="max-w-6xl gap-600">
			<Breadcrumbs
				items={[
					{ href: "/", label: t("nav.home") },
					{ href: "/dashboard", label: t("dashboard.title") },
				]}
			/>
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
					<section className="grid gap-300 lg:grid-cols-[minmax(0,1.4fr)_360px] lg:items-start">
						<div className="flex flex-col gap-300">
							<div className="max-w-3xl">
								<p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--gcds-text-secondary)]">
									{t("dashboard.resourcesEyebrow")}
								</p>
								<Heading tag="h2">{t("dashboard.resourcesTitle")}</Heading>
								<Text>{t("dashboard.resourcesSummary")}</Text>
							</div>

							<div className="flex flex-col gap-300" role="presentation">
								<section className={summaryCardClasses}>
									<Heading tag="h3">
										{t("dashboard.rpApplicationsListTitle")}
									</Heading>
									<Text>{t("dashboard.rpApplicationsDescription")}</Text>
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
								</section>
							</div>
						</div>

						<aside className={summaryCardClasses}>
							<p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--gcds-text-secondary)]">
								{t("dashboard.profileEyebrow")}
							</p>
							<div className="mt-150 flex flex-col gap-150">
								<Text>{t("dashboard.name", { value: currentUser.name })}</Text>
								<Text>
									{t("dashboard.email", { value: currentUser.email })}
								</Text>
								<Text>
									{t("dashboard.department", {
										value: departmentLabel,
									})}
								</Text>
								<div>
									<Text>{t("dashboard.roles")}</Text>
									{roleNames.length > 0 ? (
										<ul className="mt-100 flex flex-wrap gap-100">
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
										<Text>{t("dashboard.noRoles")}</Text>
									)}
								</div>
							</div>
						</aside>
					</section>
				</>
			) : null}
		</CenteredPageLayout>
	);
};
