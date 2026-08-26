/* eslint-disable camelcase -- Checklist keys mirror the stable domain vocabulary. */
import { useParams } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import type { FunctionComponent } from "@/common/types";
import { Button, Heading, Link, Notice, Text } from "@/components/ui";
import { getRequestErrorNotice } from "@/fetch";
import type {
	ApplicationInformationChecklistKey,
	ApplicationInformationChecklistStatus,
} from "@/fetch/workspaces";
import { hasCapability } from "@/features/auth/authorization";
import { useSession } from "@/hooks";
import { useApplicationInformationChecklist } from "../hooks/use-application-information-checklist";
import { useWorkspaceApplicationInformation } from "../hooks/use-workspace-application-information";

const LABEL_KEYS: Record<ApplicationInformationChecklistKey, string> = {
	business_context: "workspaces.appInfoChecklistBusinessContextLabel",
	contacts: "workspaces.appInfoChecklistContactsLabel",
	migration_planning: "workspaces.appInfoChecklistMigrationPlanningLabel",
	security_posture: "workspaces.appInfoChecklistSecurityPostureLabel",
	service_identity: "workspaces.appInfoChecklistServiceIdentityLabel",
	technical_integration: "workspaces.appInfoChecklistTechnicalIntegrationLabel",
};

const NEXT_STEP_KEYS: Record<ApplicationInformationChecklistKey, string> = {
	business_context: "workspaces.appInfoChecklistBusinessContextNextStep",
	contacts: "workspaces.appInfoChecklistContactsNextStep",
	migration_planning: "workspaces.appInfoChecklistMigrationPlanningNextStep",
	security_posture: "workspaces.appInfoChecklistSecurityPostureNextStep",
	service_identity: "workspaces.appInfoChecklistServiceIdentityNextStep",
	technical_integration:
		"workspaces.appInfoChecklistTechnicalIntegrationNextStep",
};

export const ApplicationInformationChecklistPage = (): FunctionComponent => {
	const { i18n, t } = useTranslation() as unknown as {
		i18n: { resolvedLanguage?: string };
		t: (key: string | Array<string>) => string;
	};
	const { applicationInformationUuid, workspaceUuid } = useParams({
		from: "/workspaces/$workspaceUuid/applications/$applicationInformationUuid/checklist-and-evidence",
	});
	const { currentUser } = useSession();
	const canEdit = hasCapability(
		currentUser?.authorizationContext,
		"application_information_write",
		workspaceUuid
	);
	const canViewContacts = hasCapability(
		currentUser?.authorizationContext,
		"application_information_read",
		workspaceUuid
	);
	const canViewConfigurations = hasCapability(
		currentUser?.authorizationContext,
		"rp_configuration_read",
		workspaceUuid
	);
	const { applicationInformation, error, isLoading } =
		useWorkspaceApplicationInformation(
			workspaceUuid,
			applicationInformationUuid
		);
	const {
		checklist,
		error: checklistError,
		isLoading: isLoadingChecklist,
	} = useApplicationInformationChecklist(
		workspaceUuid,
		applicationInformationUuid
	);
	const checklistItems = checklist?.items ?? [];
	const errorNotice = getRequestErrorNotice(error ?? checklistError, {
		bodyKey: "workspaces.appInfoErrorBody",
		titleKey: "workspaces.appInfoErrorTitle",
	});
	const detailsHref = canEdit
		? `/workspaces/${workspaceUuid}/applications/${applicationInformationUuid}/details/edit`
		: `/workspaces/${workspaceUuid}/applications/${applicationInformationUuid}/details`;
	const contactsHref = `/workspaces/${workspaceUuid}/applications/${applicationInformationUuid}/contacts`;
	const configurationsHref = `/workspaces/${workspaceUuid}/applications/${applicationInformationUuid}/rp-configurations`;
	const localizedApplicationName = checklist
		? (i18n.resolvedLanguage?.startsWith("fr")
				? checklist.applicationNameFr
				: checklist.applicationNameEn) || checklist.applicationNameEn
		: null;

	const getStatusLabel = (
		status: ApplicationInformationChecklistStatus
	): string => {
		switch (status) {
			case "provided":
				return t("workspaces.appInfoChecklistStatusProvided");
			case "attention_required":
				return t("workspaces.appInfoChecklistStatusAttentionRequired");
			default:
				return t("workspaces.appInfoChecklistStatusMissing");
		}
	};

	return (
		<>
			<Heading tag="h1">{t("workspaces.appInfoChecklistTitle")}</Heading>
			<Text>{t("workspaces.appInfoChecklistSummary")}</Text>
			{localizedApplicationName ? (
				<Text>
					{t("workspaces.appInfoChecklistApplicationLabel")}{" "}
					{localizedApplicationName}
				</Text>
			) : null}

			{isLoading || isLoadingChecklist ? (
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

			{applicationInformation && checklist ? (
				<div className="grid gap-400">
					<section aria-labelledby="application-checklist-heading">
						<Heading id="application-checklist-heading" tag="h2">
							{t("workspaces.appInfoChecklistInputsTitle")}
						</Heading>
						<Text>{t("workspaces.appInfoChecklistInputsBody")}</Text>
						<ul className="m-0 grid list-none p-0">
							{checklistItems.map((item) => (
								<li
									key={item.key}
									className="grid gap-100 border-0 border-b border-solid border-[var(--gcds-border-default)] py-200 tablet:grid-cols-[minmax(12rem,1fr)_minmax(9rem,0.5fr)_minmax(14rem,1fr)]"
								>
									<Text marginBottom="0">
										<strong>{t(LABEL_KEYS[item.key])}</strong>
									</Text>
									<Text marginBottom="0">{getStatusLabel(item.status)}</Text>
									{item.status === "provided" ||
									(item.key === "contacts" && !canViewContacts) ? (
										<span aria-hidden="true">—</span>
									) : (
										<div>
											<Link
												href={
													item.key === "contacts" ? contactsHref : detailsHref
												}
											>
												{t(NEXT_STEP_KEYS[item.key])}
											</Link>
										</div>
									)}
								</li>
							))}
						</ul>
					</section>

					<section aria-labelledby="cats-evidence-heading">
						<Heading id="cats-evidence-heading" tag="h2">
							{t("workspaces.appInfoChecklistCatsTitle")}
						</Heading>
						<Text>
							<strong>{t("workspaces.appInfoChecklistCatsStatusLabel")}</strong>{" "}
							{t("workspaces.appInfoChecklistCatsStatusPendingMechanism")}
						</Text>
						<Text>{t("workspaces.appInfoChecklistCatsMechanismBody")}</Text>
					</section>

					<section aria-labelledby="checklist-process-links-heading">
						<Heading id="checklist-process-links-heading" tag="h2">
							{t("workspaces.appInfoChecklistProcessLinksTitle")}
						</Heading>
						<Text>{t("workspaces.appInfoChecklistProcessLinksBody")}</Text>
						<ul>
							<li>
								<Link href={detailsHref}>
									{t("workspaces.appInfoChecklistDetailsLink")}
								</Link>
							</li>
							{canViewContacts ? (
								<li>
									<Link href={contactsHref}>
										{t("workspaces.appInfoChecklistContactsLink")}
									</Link>
								</li>
							) : null}
							{canViewConfigurations ? (
								<li>
									<Link href={configurationsHref}>
										{t("workspaces.appInfoChecklistConfigurationsLink")}
									</Link>
								</li>
							) : null}
						</ul>
						<Text>{t("workspaces.appInfoChecklistExternalProcessBody")}</Text>
					</section>
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
