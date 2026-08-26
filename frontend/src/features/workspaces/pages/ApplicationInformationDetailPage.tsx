import { useParams, useSearch } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import type { FunctionComponent } from "@/common/types";
import { Card, Grid, Heading, Link, Notice, Text } from "@/components/ui";
import { hasCapability } from "@/features/auth/authorization";
import { getRequestErrorNotice } from "@/fetch";
import { useSession } from "@/hooks";
import { useApplicationInformationContacts } from "../hooks/use-application-information-contacts";
import { useApplicationRPConfigurations } from "../hooks/use-application-rp-configurations";
import { useWorkspaceApplicationInformation } from "../hooks/use-workspace-application-information";

export const ApplicationInformationDetailPage = (): FunctionComponent => {
	const { i18n, t } = useTranslation() as unknown as {
		i18n: { resolvedLanguage?: string };
		t: (
			key: string | Array<string>,
			options?: Record<string, unknown>
		) => string;
	};
	const { currentUser } = useSession();
	const { applicationInformationUuid, workspaceUuid } = useParams({
		from: "/workspaces/$workspaceUuid/applications/$applicationInformationUuid",
	});
	const search = useSearch({
		from: "/workspaces/$workspaceUuid/applications/$applicationInformationUuid",
	});
	const authorizationContext = currentUser?.authorizationContext;
	const canReadContacts = hasCapability(
		authorizationContext,
		"application_information_read",
		workspaceUuid
	);
	const canReadConfigurations = hasCapability(
		authorizationContext,
		"rp_configuration_read",
		workspaceUuid
	);
	const { applicationInformation, error, isLoading } =
		useWorkspaceApplicationInformation(
			workspaceUuid,
			applicationInformationUuid
		);
	const {
		contacts,
		error: contactsError,
		isLoading: isLoadingContacts,
	} = useApplicationInformationContacts(
		workspaceUuid,
		applicationInformationUuid,
		canReadContacts
	);
	const {
		configurations,
		error: configurationsError,
		isLoading: isLoadingConfigurations,
	} = useApplicationRPConfigurations(
		workspaceUuid,
		applicationInformationUuid,
		canReadConfigurations
	);
	const canEdit = hasCapability(
		authorizationContext,
		"application_information_write",
		workspaceUuid
	);
	const canCreateConfiguration = hasCapability(
		authorizationContext,
		"rp_configuration_write",
		workspaceUuid
	);
	const localizedName = applicationInformation
		? i18n.resolvedLanguage?.startsWith("fr")
			? applicationInformation.serviceNameFr
			: applicationInformation.serviceNameEn
		: null;
	const contactsRequiringConfirmation = contacts.filter(
		(contact) => contact.identityConfirmationRequired
	).length;
	const errorNotice = getRequestErrorNotice(
		error ??
			(canReadContacts ? contactsError : null) ??
			(canReadConfigurations ? configurationsError : null),
		{
			bodyKey: "workspaces.appInfoErrorBody",
			titleKey: "workspaces.appInfoErrorTitle",
		}
	);
	const successMessage =
		search.created === "1"
			? t("workspaces.appInfoCreatedSuccess")
			: search.updated === "1"
				? t("workspaces.appInfoUpdatedSuccess")
				: null;

	return (
		<>
			<Heading tag="h1">
				{localizedName ?? t("workspaces.appInfoSectionTitle")}
			</Heading>
			<Text>{t("workspaces.appInfoHubSummary")}</Text>

			{successMessage ? (
				<Notice
					noticeRole="success"
					noticeTitle={successMessage}
					noticeTitleTag="h2"
				>
					<Text>{successMessage}</Text>
				</Notice>
			) : null}

			{isLoading ||
			(canReadContacts && isLoadingContacts) ||
			(canReadConfigurations && isLoadingConfigurations) ? (
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
				<div className="grid gap-400">
					<section className="grid gap-200">
						<Heading tag="h2">
							{t("workspaces.appInfoHubOverviewTitle")}
						</Heading>
						<Text>{applicationInformation.overview}</Text>
						<Grid columns="1fr" columnsDesktop="16rem 1fr" tag="dl">
							{canReadContacts ? (
								<>
									<dt>
										<strong>{t("workspaces.appInfoContactsCountLabel")}</strong>
									</dt>
									<dd>{contacts.length}</dd>
								</>
							) : null}
							{canReadConfigurations ? (
								<>
									<dt>
										<strong>
											{t("workspaces.appInfoRpConfigurationCountLabel")}
										</strong>
									</dt>
									<dd>{configurations.length}</dd>
								</>
							) : null}
							{canReadContacts ? (
								<>
									<dt>
										<strong>
											{t("workspaces.appInfoContactsConfirmationCountLabel")}
										</strong>
									</dt>
									<dd>{contactsRequiringConfirmation}</dd>
								</>
							) : null}
						</Grid>
					</section>

					<section className="grid gap-200">
						<Heading tag="h2">{t("workspaces.appInfoHubTasksTitle")}</Heading>
						<Grid columns="1fr" columnsTablet="1fr 1fr" tag="div">
							<Card
								cardTitle={t("workspaces.appInfoHubDetailsTitle")}
								cardTitleTag="h3"
								description={t("workspaces.appInfoHubDetailsDescription")}
								href={`/workspaces/${workspaceUuid}/applications/${applicationInformationUuid}/details`}
							/>
							<Card
								cardTitle={t("workspaces.appInfoChecklistTitle")}
								cardTitleTag="h3"
								description={t("workspaces.appInfoHubChecklistDescription")}
								href={`/workspaces/${workspaceUuid}/applications/${applicationInformationUuid}/checklist-and-evidence`}
							/>
							{canReadContacts ? (
								<Card
									cardTitle={t("workspaces.appInfoContacts")}
									cardTitleTag="h3"
									description={t("workspaces.appInfoContactsManagementHint")}
									href={`/workspaces/${workspaceUuid}/applications/${applicationInformationUuid}/contacts`}
								/>
							) : null}
							{canReadConfigurations &&
								(canCreateConfiguration &&
								!isLoadingConfigurations &&
								configurations.length === 0 ? (
									<Card
										cardTitle={t("workspaces.rpConfigurationCreateFirstAction")}
										cardTitleTag="h3"
										href={`/workspaces/${workspaceUuid}/applications/${applicationInformationUuid}/rp-configurations/new`}
										description={t(
											"workspaces.rpConfigurationCreateFirstDescription"
										)}
									/>
								) : (
									<Card
										cardTitle={t("workspaces.rpConfigurationsTitle")}
										cardTitleTag="h3"
										href={`/workspaces/${workspaceUuid}/applications/${applicationInformationUuid}/rp-configurations`}
										description={t(
											"workspaces.appInfoHubRpConfigurationsDescription"
										)}
									/>
								))}
						</Grid>
					</section>

					{canEdit ? (
						<section className="grid gap-100">
							<Heading tag="h2">
								{t("workspaces.appInfoManagementTitle")}
							</Heading>
							<div>
								<Link
									href={`/workspaces/${workspaceUuid}/applications/${applicationInformationUuid}/delete`}
								>
									{t("workspaces.appInfoDelete")}
								</Link>
							</div>
						</section>
					) : null}
				</div>
			) : null}
		</>
	);
};
