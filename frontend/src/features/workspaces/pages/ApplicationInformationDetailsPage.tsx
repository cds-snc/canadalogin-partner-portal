import { useParams } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import type { FunctionComponent } from "@/common/types";
import { Button, Grid, Heading, Notice, Text } from "@/components/ui";
import { hasCapability } from "@/features/auth/authorization";
import { getRequestErrorNotice } from "@/fetch";
import { useSession } from "@/hooks";
import { useWorkspaceApplicationInformation } from "../hooks/use-workspace-application-information";

export const ApplicationInformationDetailsPage = (): FunctionComponent => {
	const { i18n, t } = useTranslation() as unknown as {
		i18n: { resolvedLanguage?: string };
		t: (
			key: string | Array<string>,
			options?: Record<string, unknown>
		) => string;
	};
	const { currentUser } = useSession();
	const { applicationInformationUuid, workspaceUuid } = useParams({
		from: "/workspaces/$workspaceUuid/applications/$applicationInformationUuid/details",
	});
	const { applicationInformation, error, isLoading } =
		useWorkspaceApplicationInformation(
			workspaceUuid,
			applicationInformationUuid
		);
	const canEdit = hasCapability(
		currentUser?.authorizationContext,
		"application_information_write",
		workspaceUuid
	);
	const localizedName = applicationInformation
		? i18n.resolvedLanguage?.startsWith("fr")
			? applicationInformation.serviceNameFr
			: applicationInformation.serviceNameEn
		: null;
	const errorNotice = getRequestErrorNotice(error, {
		bodyKey: "workspaces.appInfoErrorBody",
		titleKey: "workspaces.appInfoErrorTitle",
	});
	return (
		<>
			<Heading tag="h1">
				{localizedName
					? t("workspaces.appInfoDetailsPageTitle", { name: localizedName })
					: t("workspaces.appInfoHubDetailsTitle")}
			</Heading>
			<Text>{t("workspaces.appInfoHubDetailsDescription")}</Text>

			{isLoading ? (
				<Notice
					noticeRole="info"
					noticeTitle={t("workspaces.appInfoLoadingTitle")}
					noticeTitleTag="h2"
				>
					<Text>{t("workspaces.appInfoLoadingBody")}</Text>
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

			{applicationInformation ? (
				<div className="grid gap-300">
					<Grid columns="1fr" columnsDesktop="16rem 1fr" tag="dl">
						<dt>
							<strong>{t("workspaces.appInfoServiceNameEnLabel")}</strong>
						</dt>
						<dd>{applicationInformation.serviceNameEn}</dd>
						<dt>
							<strong>{t("workspaces.appInfoServiceNameFrLabel")}</strong>
						</dt>
						<dd lang="fr">{applicationInformation.serviceNameFr}</dd>
						<dt>
							<strong>{t("workspaces.appInfoOverviewLabel")}</strong>
						</dt>
						<dd>{applicationInformation.overview}</dd>
						<dt>
							<strong>
								{t("workspaces.appInfoTechnologyAndProtocolLabel")}
							</strong>
						</dt>
						<dd>{applicationInformation.technologyAndProtocol}</dd>
						<dt>
							<strong>{t("workspaces.appInfoSecurityAndPrivacyLabel")}</strong>
						</dt>
						<dd>{applicationInformation.securityAndPrivacy}</dd>
						<dt>
							<strong>{t("workspaces.appInfoUsageLabel")}</strong>
						</dt>
						<dd>{applicationInformation.usage}</dd>
						<dt>
							<strong>
								{t("workspaces.appInfoMigrationOrTransitionPlanLabel")}
							</strong>
						</dt>
						<dd>{applicationInformation.migrationOrTransitionPlan}</dd>
					</Grid>

					{canEdit ? (
						<div>
							<Button
								buttonRole="secondary"
								href={`/workspaces/${workspaceUuid}/applications/${applicationInformationUuid}/details/edit`}
								type="link"
							>
								{t("workspaces.appInfoEdit")}
							</Button>
						</div>
					) : null}
				</div>
			) : null}

			<div className="mt-300">
				<Button
					buttonRole="secondary"
					href={`/workspaces/${workspaceUuid}/applications/${applicationInformationUuid}`}
					type="link"
				>
					{t("workspaces.appInfoBackToApplication")}
				</Button>
			</div>
		</>
	);
};
