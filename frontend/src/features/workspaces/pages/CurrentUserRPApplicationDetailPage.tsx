import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import type { FunctionComponent } from "@/common/types";
import { Breadcrumbs, CenteredPageLayout } from "@/components/layout";
import { Button, Heading, Notice, Text } from "@/components/ui";
import {
	getRedirectUrisValue,
	getSettingBoolean,
	getSettingClientType,
	getSettingString,
} from "@/features/workspaces/components/workspace-detail-utils";
import { WorkspaceApplicationModal } from "@/features/workspaces/components/WorkspaceApplicationModal";
import { getRequestErrorNotice } from "@/fetch";
import { getCurrentUserRPApplication } from "@/fetch/workspaces";

const detailCardClasses =
	"rounded-sm border border-[var(--gcds-border-default)] bg-[var(--gcds-bg-white)] px-400 py-350 shadow-[0_14px_28px_rgba(38,55,74,0.06)]";

type DetailRowProps = {
	label: string;
	value: string;
};

const DetailRow = ({ label, value }: DetailRowProps): FunctionComponent => (
	<div className="flex flex-col gap-50 border-t border-[var(--gcds-border-default)] py-150 first:border-t-0 first:pt-0 last:pb-0 md:flex-row md:items-start md:justify-between md:gap-300">
		<Text>{label}</Text>
		<Text>{value}</Text>
	</div>
);

export const CurrentUserRPApplicationDetailPage = (): FunctionComponent => {
	const { t } = useTranslation();
	const { rpApplicationUuid } = useParams({
		from: "/rp-applications/mine/$rpApplicationUuid",
	});
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const [isEditModalOpen, setIsEditModalOpen] = useState(false);
	const { data: application, error, isLoading } = useQuery({
		queryKey: ["current-user-rp-application", rpApplicationUuid],
		queryFn: () => getCurrentUserRPApplication(rpApplicationUuid),
	});

	const errorNotice = getRequestErrorNotice(error, {
		bodyKey: "workspaces.errorLoadingApplications",
		titleKey: "workspaces.errorLoadingApplications",
	});

	if (isLoading) {
		return (
			<CenteredPageLayout className="max-w-5xl">
				<Text>{t("workspaces.loadingApplications")}</Text>
			</CenteredPageLayout>
		);
	}

	if (!application) {
		return (
			<CenteredPageLayout className="max-w-5xl">
				<Notice
					noticeRole={errorNotice?.noticeRole ?? "danger"}
					noticeTitleTag="h2"
					noticeTitle={t(
						(errorNotice?.titleKey ??
							"workspaces.errorLoadingApplications") as never
					)}
				>
					<Text>
						{errorNotice?.bodyText ??
							t(
								(errorNotice?.bodyKey ??
									"workspaces.errorLoadingApplications") as never
							)}
					</Text>
				</Notice>
			</CenteredPageLayout>
		);
	}

	const applicationUrl = getSettingString(application.settings, "application_url");
	const companyName = getSettingString(application.settings, "company_name");
	const description = getSettingString(application.settings, "description");
	const clientType = getSettingClientType(application.settings);
	const pkceEnabled = getSettingBoolean(application.settings, "pkce_enabled");
	const redirectUris = getRedirectUrisValue(application.settings)
		.split(/\r?\n/)
		.filter((entry) => entry.trim().length > 0);

	return (
		<CenteredPageLayout className="max-w-5xl gap-400">
			<Breadcrumbs
				items={[
					{ href: "/", label: t("nav.home") },
					{ href: "/dashboard", label: t("dashboard.title") },
					{
						href: `/rp-applications/mine/${application.uuid}`,
						label: application.name,
					},
				]}
			/>

			<div className="flex flex-col gap-300">
				<div className="flex items-start justify-between gap-200">
					<div>
						<Heading tag="h1">
							{t("workspaces.applicationManagementTitle", {
								name: application.name,
							})}
						</Heading>
						<Text>{t("workspaces.currentUserApplicationSummary")}</Text>
					</div>
					<div>
						<Button
							buttonRole="secondary"
							type="button"
							onGcdsClick={() => {
								void navigate({ to: "/dashboard" });
							}}
						>
							{t("workspaces.backToDashboard")}
						</Button>
					</div>
				</div>

				<div className={detailCardClasses}>
					<DetailRow
						label={t("workspaces.workspaceName")}
						value={application.workspaceName}
					/>
					<DetailRow
						label={t("workspaces.applicationStatus")}
						value={application.status}
					/>
				</div>

				<div className={detailCardClasses}>
					<DetailRow
						label={t("workspaces.applicationNameLabel")}
						value={application.name}
					/>
					<DetailRow
						label={t("workspaces.applicationUrlLabel")}
						value={applicationUrl || "-"}
					/>
					<DetailRow
						label={t("workspaces.applicationCompanyNameLabel")}
						value={companyName || "-"}
					/>
					<DetailRow
						label={t("workspaces.applicationDescriptionLabel")}
						value={description || "-"}
					/>
					<DetailRow
						label={t("workspaces.applicationClientTypeLabel")}
						value={
							clientType === "public"
								? t("workspaces.applicationClientTypePublicOption")
								: t("workspaces.applicationClientTypeConfidentialOption")
						}
					/>
					<DetailRow
						label={t("workspaces.applicationPkceLabel")}
						value={
							pkceEnabled
								? t("workspaces.applicationPkceEnabledOption")
								: t("workspaces.applicationPkceDisabledOption")
						}
					/>
				</div>

				<div className={detailCardClasses}>
					<Text>{t("workspaces.applicationRedirectUrisLabel")}</Text>
					{redirectUris.length > 0 ? (
						<ul className="mt-150 flex flex-col gap-100">
							{redirectUris.map((redirectUri) => (
								<li key={redirectUri}>
									<Text>{redirectUri}</Text>
								</li>
							))}
						</ul>
					) : (
						<Text>-</Text>
					)}
				</div>

				<div className="flex justify-end border-t border-[var(--gcds-border-default)] pt-250">
					<Button
						buttonRole="secondary"
						type="button"
						onGcdsClick={() => {
							setIsEditModalOpen(true);
						}}
					>
						{t("workspaces.editApplication")}
					</Button>
				</div>
			</div>

			<WorkspaceApplicationModal
				currentUserMode
				application={application}
				isOpen={isEditModalOpen}
				mode="edit"
				workspaceUuid={application.workspaceUuid}
				onClose={() => {
					setIsEditModalOpen(false);
				}}
				onSaved={async () => {
					await queryClient.invalidateQueries({
						queryKey: ["current-user-rp-application", rpApplicationUuid],
					});
					await queryClient.invalidateQueries({
						queryKey: ["dashboard-rp-applications"],
					});
				}}
			/>
		</CenteredPageLayout>
	);
};