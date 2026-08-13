import { useState } from "react";
import { useNavigate, useParams } from "@tanstack/react-router";
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
	Text,
} from "@/components/ui";
import { getRequestErrorNotice } from "@/fetch";
import {
	useApplicationRPConfiguration,
	useApplicationRPConfigurationProgressionActions,
} from "../hooks/use-application-rp-configurations";
import { getCanadaLoginEnvironmentLabel } from "../onboarding-display";

export const ApplicationRPConfigurationProgressionPage =
	(): FunctionComponent => {
		const { t } = useTranslation() as unknown as {
			t: (key: string, options?: Record<string, unknown>) => string;
		};
		const navigate = useNavigate();
		const { applicationInformationUuid, rpConfigurationUuid, workspaceUuid } =
			useParams({
				from: "/workspaces/$workspaceUuid/applications/$applicationInformationUuid/rp-configurations/$rpConfigurationUuid/progression",
			});
		const { configuration, error, isLoading } = useApplicationRPConfiguration(
			workspaceUuid,
			applicationInformationUuid,
			rpConfigurationUuid
		);
		const { createProgression, isCreating } =
			useApplicationRPConfigurationProgressionActions();
		const [progressionCreationKey] = useState(() => crypto.randomUUID());
		const [targetConfigurationName, setTargetConfigurationName] = useState("");
		const [targetPartnerEnvironment, setTargetPartnerEnvironment] =
			useState("");
		const [submitted, setSubmitted] = useState(false);
		const [requestError, setRequestError] = useState<Error | null>(null);
		const sourceEnvironment = configuration?.canadaLoginEnvironment?.trim();
		const targetEnvironment =
			sourceEnvironment === "test"
				? "staging"
				: sourceEnvironment === "staging"
					? "production"
					: null;
		const basePath = `/workspaces/${encodeURIComponent(workspaceUuid)}/applications/${encodeURIComponent(applicationInformationUuid)}/rp-configurations/${encodeURIComponent(rpConfigurationUuid)}`;
		const listPath = `/workspaces/${encodeURIComponent(workspaceUuid)}/applications/${encodeURIComponent(applicationInformationUuid)}/rp-configurations`;
		const nameError =
			submitted && !targetConfigurationName.trim()
				? t("workspaces.rpProgressionNameRequired")
				: undefined;
		const partnerEnvironmentError =
			submitted && !targetPartnerEnvironment.trim()
				? t("workspaces.rpProgressionPartnerEnvironmentRequired")
				: undefined;
		const errorNotice = getRequestErrorNotice(requestError ?? error, {
			bodyKey: "workspaces.rpProgressionErrorBody",
			titleKey: "workspaces.rpProgressionErrorTitle",
		});

		const handleSubmit = async (): Promise<void> => {
			setSubmitted(true);
			setRequestError(null);
			if (
				!targetConfigurationName.trim() ||
				!targetPartnerEnvironment.trim() ||
				!targetEnvironment
			)
				return;

			try {
				const progression = await createProgression(
					workspaceUuid,
					applicationInformationUuid,
					rpConfigurationUuid,
					{
						targetConfigurationName,
						targetPartnerEnvironment,
						targetEnvironment,
					},
					progressionCreationKey
				);
				await navigate({
					href: `${listPath}/${encodeURIComponent(progression.targetRpConfigurationUuid)}/registration/endpoints`,
					replace: true,
				});
			} catch (submissionError) {
				setRequestError(submissionError as Error);
			}
		};

		return (
			<div className="grid gap-400">
				<div>
					<Heading tag="h1">{t("workspaces.rpProgressionTitle")}</Heading>
					<Text>{t("workspaces.rpProgressionSummary")}</Text>
				</div>

				{nameError || partnerEnvironmentError ? <ErrorSummary listen /> : null}
				{isLoading ? (
					<Notice
						noticeRole="info"
						noticeTitle={t("workspaces.applicationsLoadingTitle")}
						noticeTitleTag="h2"
					>
						<Text>{t("workspaces.applicationsLoadingBody")}</Text>
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

				{configuration && targetEnvironment ? (
					<form
						className="grid gap-300"
						onSubmit={(event) => {
							event.preventDefault();
							void handleSubmit();
						}}
					>
						<Heading tag="h2">
							{t("workspaces.rpProgressionSourceTitle")}
						</Heading>
						<Grid columns="1fr" columnsDesktop="16rem 1fr" tag="dl">
							<dt>
								<strong>{t("workspaces.rpProgressionSourceLabel")}</strong>
							</dt>
							<dd>{configuration.configurationName}</dd>
							<dt>
								<strong>
									{t("workspaces.applicationsPartnerEnvironmentLabel")}
								</strong>
							</dt>
							<dd>
								{configuration.partnerEnvironment?.trim() ||
									t("common.notProvided")}
							</dd>
							<dt>
								<strong>{t("yourApplications.environmentLabel")}</strong>
							</dt>
							<dd>
								{getCanadaLoginEnvironmentLabel(
									t as never,
									sourceEnvironment ?? ""
								)}
							</dd>
							<dt>
								<strong>{t("workspaces.rpProgressionTargetLabel")}</strong>
							</dt>
							<dd>
								{getCanadaLoginEnvironmentLabel(t as never, targetEnvironment)}
							</dd>
						</Grid>

						{targetEnvironment === "production" ? (
							<Notice
								noticeRole="warning"
								noticeTitle={t("workspaces.rpProgressionReviewTitle")}
								noticeTitleTag="h2"
							>
								<Text>{t("workspaces.rpProgressionReviewBody")}</Text>
							</Notice>
						) : (
							<Notice
								noticeRole="info"
								noticeTitle={t("workspaces.rpProgressionSelfServeTitle")}
								noticeTitleTag="h2"
							>
								<Text>{t("workspaces.rpProgressionSelfServeBody")}</Text>
							</Notice>
						)}

						<Input
							required
							errorMessage={nameError}
							hint={t("workspaces.rpProgressionNameHint")}
							inputId="rp-progression-target-name"
							label={t("workspaces.rpProgressionNameLabel")}
							maxLength={128}
							name="targetConfigurationName"
							value={targetConfigurationName}
							onInput={(event): void => {
								setTargetConfigurationName(
									(event.target as HTMLInputElement).value
								);
							}}
						/>

						<Input
							required
							errorMessage={partnerEnvironmentError}
							hint={t("workspaces.rpProgressionPartnerEnvironmentHint")}
							inputId="rp-progression-target-partner-environment"
							label={t("workspaces.rpProgressionPartnerEnvironmentLabel")}
							maxLength={128}
							name="targetPartnerEnvironment"
							value={targetPartnerEnvironment}
							onInput={(event): void => {
								setTargetPartnerEnvironment(
									(event.target as HTMLInputElement).value
								);
							}}
						/>

						<div className="flex flex-wrap gap-200">
							<Button disabled={isCreating} type="submit">
								{isCreating
									? t("workspaces.rpProgressionCreatingAction")
									: t("workspaces.rpProgressionCreateAction")}
							</Button>
							<Button buttonRole="secondary" href={basePath} type="link">
								{t("common.cancel")}
							</Button>
						</div>
					</form>
				) : null}

				{configuration && !targetEnvironment ? (
					<Notice
						noticeRole="warning"
						noticeTitle={t("workspaces.rpProgressionUnavailableTitle")}
						noticeTitleTag="h2"
					>
						<Text>{t("workspaces.rpProgressionUnavailableBody")}</Text>
					</Notice>
				) : null}

				<div>
					<Link href={basePath}>{t("workspaces.rpProgressionBack")}</Link>
				</div>
			</div>
		);
	};
