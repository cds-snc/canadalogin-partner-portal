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
import { getRequestErrorNotice, HttpRequestError } from "@/fetch";
import { useSession } from "@/hooks";
import { useApplicationRPConfiguration } from "../hooks/use-application-rp-configurations";
import {
	useApplicationRPConfigurationPromotion,
	useApplicationRPConfigurationPromotionActions,
} from "../hooks/use-application-rp-configuration-promotion";
import { getWorkspacePromotionStatusLabel } from "../onboarding-display";

type ReviewStatus = "changes_requested" | "approved" | "launched";

export const ApplicationRPConfigurationProductionReviewPage =
	(): FunctionComponent => {
		const { t } = useTranslation() as unknown as {
			t: (key: string, options?: Record<string, unknown>) => string;
		};
		const { currentUser } = useSession();
		const { applicationInformationUuid, rpConfigurationUuid, workspaceUuid } =
			useParams({
				from: "/workspaces/$workspaceUuid/applications/$applicationInformationUuid/rp-configurations/$rpConfigurationUuid/production-review",
			});
		const { configuration, error: configurationError } =
			useApplicationRPConfiguration(
				workspaceUuid,
				applicationInformationUuid,
				rpConfigurationUuid
			);
		const {
			error: promotionError,
			isLoading,
			promotion,
			refetch,
		} = useApplicationRPConfigurationPromotion(
			workspaceUuid,
			applicationInformationUuid,
			rpConfigurationUuid
		);
		const { isRequesting, isReviewing, requestReview, review } =
			useApplicationRPConfigurationPromotionActions();
		const [externalReference, setExternalReference] = useState("");
		const [reviewedByTeam, setReviewedByTeam] = useState("");
		const [reviewStatus, setReviewStatus] =
			useState<ReviewStatus>("changes_requested");
		const [submitted, setSubmitted] = useState(false);
		const [requestError, setRequestError] = useState<Error | null>(null);
		const [successKey, setSuccessKey] = useState<string | null>(null);
		const authorizationContext = currentUser?.authorizationContext;
		const canRequest = hasCapability(
			authorizationContext,
			"promotion_request_write",
			workspaceUuid
		);
		const canReview = hasCapability(
			authorizationContext,
			"production_review",
			workspaceUuid
		);
		const promotionNotFound =
			promotionError instanceof HttpRequestError &&
			promotionError.status === 404;
		const effectiveError =
			requestError ??
			configurationError ??
			(promotionNotFound ? null : promotionError);
		const errorNotice = getRequestErrorNotice(effectiveError, {
			bodyKey: "workspaces.rpProductionReviewErrorBody",
			titleKey: "workspaces.rpProductionReviewErrorTitle",
		});
		const externalReferenceRequired =
			submitted &&
			canReview &&
			(reviewStatus === "approved" || reviewStatus === "launched") &&
			!externalReference.trim();
		const basePath = `/workspaces/${encodeURIComponent(workspaceUuid)}/applications/${encodeURIComponent(applicationInformationUuid)}/rp-configurations/${encodeURIComponent(rpConfigurationUuid)}`;

		const handleRequest = async (): Promise<void> => {
			setRequestError(null);
			setSuccessKey(null);
			try {
				await requestReview(
					workspaceUuid,
					applicationInformationUuid,
					rpConfigurationUuid,
					externalReference.trim()
						? { externalReference: externalReference.trim() }
						: {}
				);
				setSuccessKey("workspaces.rpProductionReviewRequestedSuccess");
				await refetch();
			} catch (error) {
				setRequestError(error as Error);
			}
		};

		const handleReview = async (): Promise<void> => {
			setSubmitted(true);
			setRequestError(null);
			setSuccessKey(null);
			if (
				(reviewStatus === "approved" || reviewStatus === "launched") &&
				!externalReference.trim()
			) {
				return;
			}
			try {
				await review(
					workspaceUuid,
					applicationInformationUuid,
					rpConfigurationUuid,
					{
						...(externalReference.trim()
							? { externalReference: externalReference.trim() }
							: {}),
						...(reviewedByTeam.trim()
							? { reviewedByTeam: reviewedByTeam.trim() }
							: {}),
						status: reviewStatus,
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

				{externalReferenceRequired ? <ErrorSummary listen /> : null}
				{successKey ? (
					<Notice
						noticeRole="success"
						noticeTitle={t(successKey)}
						noticeTitleTag="h2"
					>
						<Text>{t(successKey)}</Text>
					</Notice>
				) : null}
				{isLoading ? (
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

				{configuration?.canadaLoginEnvironment !== "production" ? (
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
								<strong>{t("workspaces.rpConfigurationNameLabel")}</strong>
							</dt>
							<dd>{configuration.configurationName}</dd>
							<dt>
								<strong>{t("workspaces.rpProductionReviewStatusLabel")}</strong>
							</dt>
							<dd>
								{promotion
									? getWorkspacePromotionStatusLabel(
											t as never,
											promotion.status
										)
									: t("workspaces.rpProductionReviewNotRequested")}
							</dd>
							{promotion?.sourceRpConfigurationUuid ? (
								<>
									<dt>
										<strong>{t("workspaces.rpProgressionSourceLabel")}</strong>
									</dt>
									<dd>
										<Link
											href={`/workspaces/${encodeURIComponent(workspaceUuid)}/applications/${encodeURIComponent(applicationInformationUuid)}/rp-configurations/${encodeURIComponent(promotion.sourceRpConfigurationUuid)}`}
										>
											{t("workspaces.rpProductionReviewViewSource")}
										</Link>
									</dd>
								</>
							) : null}
						</Grid>

						{canRequest ? (
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
									inputId="production-request-reference"
									label={t("workspaces.rpProductionReviewReferenceLabel")}
									maxLength={255}
									name="externalReference"
									value={externalReference}
									onInput={(event): void => {
										setExternalReference(
											(event.target as HTMLInputElement).value
										);
									}}
								/>
								<Button disabled={isRequesting} type="submit">
									{t("workspaces.rpProductionReviewRequestAction")}
								</Button>
							</form>
						) : null}

						{canReview && promotion ? (
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
									value={reviewStatus}
									onInput={(event): void => {
										setReviewStatus(
											(event.target as HTMLSelectElement).value as ReviewStatus
										);
									}}
								>
									<option value="changes_requested">
										{t("workspaces.promotionStatusChangesRequested")}
									</option>
									<option value="approved">
										{t("workspaces.promotionStatusApproved")}
									</option>
									<option value="launched">
										{t("workspaces.promotionStatusLaunched")}
									</option>
								</Select>
								<Input
									inputId="production-review-reference"
									label={t("workspaces.rpProductionReviewReferenceLabel")}
									maxLength={255}
									name="externalReference"
									value={externalReference}
									errorMessage={
										externalReferenceRequired
											? t("workspaces.rpProductionReviewReferenceRequired")
											: undefined
									}
									required={
										reviewStatus === "approved" || reviewStatus === "launched"
									}
									onInput={(event): void => {
										setExternalReference(
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
					</>
				) : null}

				<div>
					<Link href={basePath}>{t("workspaces.rpProductionReviewBack")}</Link>
				</div>
			</div>
		);
	};
