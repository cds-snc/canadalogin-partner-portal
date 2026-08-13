/* eslint-disable camelcase -- Readiness keys mirror the canonical API contract. */
import { useParams } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import type { FunctionComponent } from "@/common/types";
import { Button, Details, Heading, Link, Notice, Text } from "@/components/ui";
import { getRequestErrorNotice } from "@/fetch";
import { hasCapability } from "@/features/auth/authorization";
import { useSession } from "@/hooks";
import { useApplicationInformationContacts } from "../hooks/use-application-information-contacts";
import { useWorkspaceApplicationInformation } from "../hooks/use-workspace-application-information";
import {
	getApplicationInformationReadinessSummary,
	type ApplicationInformationReadinessKey,
	type ApplicationInformationReadinessStatus,
} from "../onboarding-readiness";

const LABEL_KEYS: Record<ApplicationInformationReadinessKey, string> = {
	business_context: "workspaces.appInfoReadinessBusinessContextLabel",
	contacts: "workspaces.appInfoReadinessContactsLabel",
	migration_planning: "workspaces.appInfoReadinessMigrationPlanningLabel",
	security_posture: "workspaces.appInfoReadinessSecurityPostureLabel",
	service_identity: "workspaces.appInfoReadinessServiceIdentityLabel",
	technical_integration: "workspaces.appInfoReadinessTechnicalIntegrationLabel",
};

const NEXT_STEP_KEYS: Record<ApplicationInformationReadinessKey, string> = {
	business_context: "workspaces.appInfoReadinessBusinessContextNextStep",
	contacts: "workspaces.appInfoReadinessContactsNextStep",
	migration_planning: "workspaces.appInfoReadinessMigrationPlanningNextStep",
	security_posture: "workspaces.appInfoReadinessSecurityPostureNextStep",
	service_identity: "workspaces.appInfoReadinessServiceIdentityNextStep",
	technical_integration:
		"workspaces.appInfoReadinessTechnicalIntegrationNextStep",
};

export const ApplicationInformationReadinessPage = (): FunctionComponent => {
	const { t } = useTranslation() as unknown as {
		t: (
			key: string | Array<string>,
			options?: Record<string, unknown>
		) => string;
	};
	const { applicationInformationUuid, workspaceUuid } = useParams({
		from: "/workspaces/$workspaceUuid/applications/$applicationInformationUuid/readiness",
	});
	const { currentUser } = useSession();
	const canEdit = hasCapability(
		currentUser?.authorizationContext,
		"application_information_write",
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
		applicationInformationUuid
	);
	const readiness = applicationInformation
		? getApplicationInformationReadinessSummary(
				applicationInformation,
				contacts
			)
		: null;
	const errorNotice = getRequestErrorNotice(error ?? contactsError, {
		bodyKey: "workspaces.appInfoErrorBody",
		titleKey: "workspaces.appInfoErrorTitle",
	});
	const getStatusLabel = (
		status: ApplicationInformationReadinessStatus
	): string => {
		switch (status) {
			case "complete":
				return t("workspaces.appInfoReadinessStatusComplete");
			case "incomplete":
				return t("workspaces.appInfoReadinessStatusIncomplete");
			default:
				return t("workspaces.appInfoReadinessStatusNotStarted");
		}
	};
	const detailsNextStepHref = canEdit
		? `/workspaces/${workspaceUuid}/applications/${applicationInformationUuid}/details/edit`
		: `/workspaces/${workspaceUuid}/applications/${applicationInformationUuid}/details`;
	const contactsNextStepHref = `/workspaces/${workspaceUuid}/applications/${applicationInformationUuid}/contacts`;

	return (
		<>
			<Heading tag="h1">{t("workspaces.appInfoReadinessTitle")}</Heading>
			<Text>{t("workspaces.appInfoHubReadinessDescription")}</Text>

			{isLoading || isLoadingContacts ? (
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

			{readiness ? (
				<div className="grid gap-300">
					<Text>
						<strong>
							{readiness.submitReady
								? t("workspaces.appInfoReadinessReady")
								: t("workspaces.appInfoReadinessAttentionRequired")}
						</strong>{" "}
						—{" "}
						{t("workspaces.appInfoReadinessOverallCount", {
							completed: readiness.completedCount,
							total: readiness.totalCount,
						})}
					</Text>

					<ul className="m-0 grid list-none p-0">
						{readiness.items.map((item) => (
							<li
								key={item.key}
								className="grid gap-100 border-0 border-b border-solid border-[var(--gcds-border-default)] py-200 tablet:grid-cols-[minmax(12rem,1fr)_minmax(8rem,0.5fr)_minmax(14rem,1fr)]"
							>
								<Text marginBottom="0">
									<strong>{t(LABEL_KEYS[item.key])}</strong>
								</Text>
								<Text marginBottom="0">{getStatusLabel(item.status)}</Text>
								{item.status !== "complete" ? (
									<div>
										<Link
											href={
												item.key === "contacts"
													? contactsNextStepHref
													: detailsNextStepHref
											}
										>
											{t(NEXT_STEP_KEYS[item.key])}
										</Link>
									</div>
								) : (
									<span aria-hidden="true">—</span>
								)}
							</li>
						))}
					</ul>

					<Details
						detailsTitle={t("workspaces.appInfoReadinessExternalInfoTitle")}
					>
						<Text>{t("workspaces.appInfoReadinessExternalInfoBody")}</Text>
					</Details>
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
