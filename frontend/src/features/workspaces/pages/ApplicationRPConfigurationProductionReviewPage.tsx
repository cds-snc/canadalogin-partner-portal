import { useState } from "react";
import { useParams } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import type { FunctionComponent } from "@/common/types";
import {
	Button,
	ErrorSummary,
	Grid,
	Heading,
	Input,
	Link,
	Notice,
	Select,
	Text,
} from "@/components/ui";
import { hasCapability } from "@/features/auth/authorization";
import { getLocalizedRPApplicationName } from "@/features/rp-applications/rp-application-summary";
import { getRequestErrorNotice, HttpRequestError } from "@/fetch";
import { useSession } from "@/hooks";
import { useApplicationRPConfiguration } from "../hooks/use-application-rp-configurations";
import {
	useApplicationRPConfigurationProductionReview,
	useApplicationRPConfigurationProductionReviewActions,
} from "../hooks/use-application-rp-configuration-production-review";
import { getProductionReviewSummaryLabel } from "../onboarding-display";

type ReviewDecision = "approved" | "rejected";

export const ApplicationRPConfigurationProductionReviewPage =
	(): FunctionComponent => {
		const { i18n, t } = useTranslation() as unknown as {
			i18n: { resolvedLanguage?: string };
			t: (key: string, options?: Record<string, unknown>) => string;
		};
		const { currentUser } = useSession();
		const { applicationInformationUuid, rpConfigurationUuid, workspaceUuid } =
			useParams({
				from: "/workspaces/$workspaceUuid/applications/$applicationInformationUuid/rp-configurations/$rpConfigurationUuid/production-review",
			});
		const {
			configuration,
			error: configurationError,
			isLoading: isConfigurationLoading,
		} = useApplicationRPConfiguration(
			workspaceUuid,
			applicationInformationUuid,
			rpConfigurationUuid
		);
		const {
			error: productionReviewError,
			isLoading,
			productionReview,
			refetch,
		} = useApplicationRPConfigurationProductionReview(
			workspaceUuid,
			applicationInformationUuid,
			rpConfigurationUuid
		);
		const { isRequesting, isReviewing, requestReview, review } =
			useApplicationRPConfigurationProductionReviewActions();
		const [requestReference, setRequestReference] = useState<string | null>(
			null
		);
		const [decisionReference, setDecisionReference] = useState<string | null>(
			null
		);
		const [reviewedByTeam, setReviewedByTeam] = useState("");
		const [reviewDecision, setReviewDecision] =
			useState<ReviewDecision>("rejected");
		const [requestSubmitted, setRequestSubmitted] = useState(false);
		const [decisionSubmitted, setDecisionSubmitted] = useState(false);
		const [requestError, setRequestError] = useState<Error | null>(null);
		const [successKey, setSuccessKey] = useState<string | null>(null);
		const authorizationContext = currentUser?.authorizationContext;
		const canRequest = hasCapability(
			authorizationContext,
			"production_review_request_write",
			workspaceUuid
		);
		const canReview = hasCapability(
			authorizationContext,
			"production_review",
			workspaceUuid
		);
		const productionReviewNotFound =
			productionReviewError instanceof HttpRequestError &&
			productionReviewError.status === 404;
		const productionReviewReconciliationRequired = Boolean(
			configuration?.productionReviewReconciliationRequired
		);
		const effectiveError =
			requestError ??
			configurationError ??
			(productionReviewNotFound || productionReviewReconciliationRequired
				? null
				: productionReviewError);
		const errorNotice = getRequestErrorNotice(effectiveError, {
			bodyKey: "workspaces.rpProductionReviewErrorBody",
			titleKey: "workspaces.rpProductionReviewErrorTitle",
		});
		const requestReferenceValue =
			requestReference ?? productionReview?.externalReference ?? "";
		const decisionReferenceValue =
			decisionReference ?? productionReview?.externalReference ?? "";
		const requestReferenceRequired =
			requestSubmitted && !requestReferenceValue.trim();
		const decisionReferenceRequired =
			decisionSubmitted && !decisionReferenceValue.trim();
		const isPending = productionReview?.status === "pending";
		const productionReviewResolved =
			!isLoading && (!productionReviewError || productionReviewNotFound);
		const canEditRequest =
			canRequest &&
			productionReviewResolved &&
			(!productionReview || isPending);
		const canRecordDecision = canReview && isPending;
		const basePath = `/workspaces/${encodeURIComponent(workspaceUuid)}/applications/${encodeURIComponent(applicationInformationUuid)}/rp-configurations/${encodeURIComponent(rpConfigurationUuid)}`;
		const checklistPath = `/workspaces/${encodeURIComponent(workspaceUuid)}/applications/${encodeURIComponent(applicationInformationUuid)}/checklist-and-evidence`;
		const applicationName = configuration
			? getLocalizedRPApplicationName(
					configuration,
					i18n.resolvedLanguage ?? "en"
				)
			: null;

		const handleRequest = async (): Promise<void> => {
			setRequestSubmitted(true);
			setRequestError(null);
			setSuccessKey(null);
			if (!requestReferenceValue.trim()) return;
			try {
				await requestReview(
					workspaceUuid,
					applicationInformationUuid,
					rpConfigurationUuid,
					{ externalReference: requestReferenceValue.trim() }
				);
				setSuccessKey("workspaces.rpProductionReviewRequestedSuccess");
				await refetch();
			} catch (error) {
				setRequestError(error as Error);
			}
		};

		const handleReview = async (): Promise<void> => {
			setDecisionSubmitted(true);
			setRequestError(null);
			setSuccessKey(null);
			if (!decisionReferenceValue.trim()) return;
			try {
				await review(
					workspaceUuid,
					applicationInformationUuid,
					rpConfigurationUuid,
					{
						externalReference: decisionReferenceValue.trim(),
						...(reviewedByTeam.trim()
							? { reviewedByTeam: reviewedByTeam.trim() }
							: {}),
						status: reviewDecision,
					}
				);
				setSuccessKey("workspaces.rpProductionReviewRecordedSuccess");
				await refetch();
			} catch (error) {
				setRequestError(error as Error);
			}
		};

		return (
			<div className="grid gap-400">
				<div>
					<Heading tag="h1">{t("workspaces.rpProductionReviewTitle")}</Heading>
					<Text>{t("workspaces.rpProductionReviewSummary")}</Text>
				</div>

				{requestReferenceRequired || decisionReferenceRequired ? (
					<ErrorSummary listen />
				) : null}
				{successKey ? (
					<Notice
						noticeRole="success"
						noticeTitle={t(successKey)}
						noticeTitleTag="h2"
					>
						<Text>{t(successKey)}</Text>
					</Notice>
				) : null}
				{isLoading || isConfigurationLoading ? (
					<Notice
						noticeRole="info"
						noticeTitle={t("workspaces.rpProductionReviewLoadingTitle")}
						noticeTitleTag="h2"
					>
						<Text>{t("workspaces.rpProductionReviewLoadingBody")}</Text>
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
				{productionReviewReconciliationRequired ? (
					<Notice
						noticeRole="warning"
						noticeTitle={t("workspaces.productionReviewReconciliationRequired")}
						noticeTitleTag="h2"
					>
						<Text>{t("workspaces.productionReviewReconciliationBody")}</Text>
					</Notice>
				) : null}

				{configuration &&
				configuration.canadaLoginEnvironment !== "production" ? (
					<Notice
						noticeRole="warning"
						noticeTitle={t("workspaces.rpProductionReviewUnavailableTitle")}
						noticeTitleTag="h2"
					>
						<Text>{t("workspaces.rpProductionReviewUnavailableBody")}</Text>
					</Notice>
				) : null}

				{configuration?.canadaLoginEnvironment === "production" ? (
					<>
						<Heading tag="h2">
							{t("workspaces.rpProductionReviewContextTitle")}
						</Heading>
						<Grid columns="1fr" columnsDesktop="16rem 1fr" tag="dl">
							<dt>
								<strong>
									{t("workspaces.rpConfigurationsApplicationLabel")}
								</strong>
							</dt>
							<dd>{applicationName}</dd>
							<dt>
								<strong>{t("workspaces.rpConfigurationNameLabel")}</strong>
							</dt>
							<dd>{configuration.configurationName}</dd>
							<dt>
								<strong>{t("workspaces.rpProductionReviewStatusLabel")}</strong>
							</dt>
							<dd>
								{getProductionReviewSummaryLabel(
									t as never,
									productionReview?.status,
									productionReviewReconciliationRequired
								)}
							</dd>
							{productionReview?.sourceRpConfigurationUuid ? (
								<>
									<dt>
										<strong>{t("workspaces.rpCopySourceLabel")}</strong>
									</dt>
									<dd>
										<Link
											href={`/workspaces/${encodeURIComponent(workspaceUuid)}/applications/${encodeURIComponent(applicationInformationUuid)}/rp-configurations/${encodeURIComponent(productionReview.sourceRpConfigurationUuid)}`}
										>
											{t("workspaces.rpProductionReviewViewSource")}
										</Link>
									</dd>
								</>
							) : null}
						</Grid>

						<Notice
							noticeRole="info"
							noticeTitle={t("workspaces.rpProductionReviewChecklistTitle")}
							noticeTitleTag="h2"
						>
							<Text>{t("workspaces.rpProductionReviewChecklistBody")}</Text>
							<Link href={checklistPath}>
								{t("workspaces.rpProductionReviewChecklistAction")}
							</Link>
						</Notice>

						{canEditRequest ? (
							<form
								className="grid gap-300"
								onSubmit={(event) => {
									event.preventDefault();
									void handleRequest();
								}}
							>
								<Heading tag="h2">
									{t("workspaces.rpProductionReviewRequestTitle")}
								</Heading>
								<Input
									required
									inputId="production-request-reference"
									label={t("workspaces.rpProductionReviewReferenceLabel")}
									maxLength={255}
									name="externalReference"
									value={requestReferenceValue}
									errorMessage={
										requestReferenceRequired
											? t("workspaces.rpProductionReviewReferenceRequired")
											: undefined
									}
									onInput={(event): void => {
										setRequestReference(
											(event.target as HTMLInputElement).value
										);
									}}
								/>
								<Button disabled={isRequesting} type="submit">
									{t(
										productionReview
											? "workspaces.rpProductionReviewUpdateAction"
											: "workspaces.rpProductionReviewRequestAction"
									)}
								</Button>
							</form>
						) : null}

						{canRecordDecision ? (
							<form
								className="grid gap-300"
								onSubmit={(event) => {
									event.preventDefault();
									void handleReview();
								}}
							>
								<Heading tag="h2">
									{t("workspaces.rpProductionReviewDecisionTitle")}
								</Heading>
								<Select
									required
									label={t("workspaces.rpProductionReviewDecisionLabel")}
									name="reviewStatus"
									selectId="production-review-status"
									value={reviewDecision}
									onInput={(event): void => {
										setReviewDecision(
											(event.target as HTMLSelectElement)
												.value as ReviewDecision
										);
									}}
								>
									<option value="approved">
										{t("workspaces.productionReviewStatusApproved")}
									</option>
									<option value="rejected">
										{t("workspaces.productionReviewStatusRejected")}
									</option>
								</Select>
								<Input
									required
									inputId="production-review-reference"
									label={t("workspaces.rpProductionReviewReferenceLabel")}
									maxLength={255}
									name="externalReference"
									value={decisionReferenceValue}
									errorMessage={
										decisionReferenceRequired
											? t("workspaces.rpProductionReviewReferenceRequired")
											: undefined
									}
									onInput={(event): void => {
										setDecisionReference(
											(event.target as HTMLInputElement).value
										);
									}}
								/>
								<Input
									inputId="production-review-team"
									label={t("workspaces.rpProductionReviewTeamLabel")}
									maxLength={128}
									name="reviewedByTeam"
									value={reviewedByTeam}
									onInput={(event): void => {
										setReviewedByTeam((event.target as HTMLInputElement).value);
									}}
								/>
								<Button disabled={isReviewing} type="submit">
									{t("workspaces.rpProductionReviewRecordAction")}
								</Button>
							</form>
						) : null}

						{productionReview && !isPending ? (
							<Notice
								noticeRole="info"
								noticeTitle={t("workspaces.rpProductionReviewTerminalTitle")}
								noticeTitleTag="h2"
							>
								<Text>{t("workspaces.rpProductionReviewTerminalBody")}</Text>
							</Notice>
						) : null}
					</>
				) : null}

				<div>
					<Link href={basePath}>{t("workspaces.rpProductionReviewBack")}</Link>
				</div>
			</div>
		);
	};
