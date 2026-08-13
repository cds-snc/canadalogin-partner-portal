import { useParams } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import type { FunctionComponent } from "@/common/types";
import { Button, Heading, Link, Notice, Text } from "@/components/ui";
import { hasCapability } from "@/features/auth/authorization";
import { RPApplicationSummaryTable } from "@/features/rp-applications/components/RPApplicationSummaryCard";
import { getRequestErrorNotice } from "@/fetch";
import { useSession } from "@/hooks";
import { useApplicationRPConfigurations } from "../hooks/use-application-rp-configurations";
import { useWorkspaceApplicationInformation } from "../hooks/use-workspace-application-information";

export const ApplicationInformationRPConfigurationsPage =
	(): FunctionComponent => {
		const { i18n, t } = useTranslation() as unknown as {
			i18n: { resolvedLanguage?: string };
			t: (
				key: string | Array<string>,
				options?: Record<string, unknown>
			) => string;
		};
		const { applicationInformationUuid, workspaceUuid } = useParams({
			from: "/workspaces/$workspaceUuid/applications/$applicationInformationUuid/rp-configurations/",
		});
		const { currentUser } = useSession();
		const canCreateConfiguration = hasCapability(
			currentUser?.authorizationContext,
			"rp_configuration_write",
			workspaceUuid
		);
		const {
			applicationInformation,
			error: applicationError,
			isLoading: isLoadingApplication,
		} = useWorkspaceApplicationInformation(
			workspaceUuid,
			applicationInformationUuid
		);
		const { configurations, error, isLoading } = useApplicationRPConfigurations(
			workspaceUuid,
			applicationInformationUuid
		);
		const applicationName = applicationInformation
			? i18n.resolvedLanguage?.startsWith("fr")
				? applicationInformation.serviceNameFr
				: applicationInformation.serviceNameEn
			: null;
		const pageTitle = applicationName
			? t("workspaces.rpConfigurationsPageTitle", {
					name: applicationName,
				})
			: t("workspaces.rpConfigurationsTitle");
		const requestError = error ?? applicationError;
		const errorNotice = getRequestErrorNotice(requestError, {
			bodyKey: "workspaces.rpConfigurationsErrorBody",
			titleKey: "workspaces.rpConfigurationsErrorTitle",
		});

		return (
			<div className="grid gap-400">
				<div>
					<Heading tag="h1">{pageTitle}</Heading>
					<Text>{t("workspaces.rpConfigurationsSummary")}</Text>
				</div>

				{isLoadingApplication || isLoading ? (
					<Notice
						noticeRole="info"
						noticeTitle={t("workspaces.rpConfigurationsLoadingTitle")}
						noticeTitleTag="h2"
					>
						<Text>{t("workspaces.rpConfigurationsLoadingBody")}</Text>
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

				{canCreateConfiguration && !requestError ? (
					<div>
						<Button
							href={`/workspaces/${workspaceUuid}/applications/${applicationInformationUuid}/rp-configurations/new`}
							type="link"
						>
							{t("workspaces.rpConfigurationCreateAction")}
						</Button>
					</div>
				) : null}

				{!isLoading && !requestError && configurations.length === 0 ? (
					<Notice
						noticeRole="info"
						noticeTitle={t("workspaces.rpConfigurationsEmptyTitle")}
						noticeTitleTag="h2"
					>
						<Text>{t("workspaces.rpConfigurationsEmptyBody")}</Text>
						{canCreateConfiguration ? (
							<div className="mt-200">
								<Button
									href={`/workspaces/${workspaceUuid}/applications/${applicationInformationUuid}/rp-configurations/new`}
									type="link"
								>
									{t("workspaces.rpConfigurationCreateAction")}
								</Button>
							</div>
						) : null}
					</Notice>
				) : null}

				{configurations.length > 0 ? (
					<RPApplicationSummaryTable
						applications={configurations}
						label={pageTitle}
					/>
				) : null}

				<div>
					<Link
						href={`/workspaces/${workspaceUuid}/applications/${applicationInformationUuid}`}
					>
						{t("workspaces.appInfoBackToApplication")}
					</Link>
				</div>
			</div>
		);
	};
