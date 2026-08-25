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
	Select,
	Text,
} from "@/components/ui";
import { getRequestErrorNotice } from "@/fetch";
import type { CanadaLoginEnvironment } from "@/fetch/rp-applications";
import {
	useApplicationRPConfiguration,
	useApplicationRPConfigurationCopyActions,
} from "../hooks/use-application-rp-configurations";
import { getCanadaLoginEnvironmentLabel } from "../onboarding-display";

const CANADA_LOGIN_ENVIRONMENTS: ReadonlyArray<CanadaLoginEnvironment> = [
	"test",
	"staging",
	"production",
];

const isCanadaLoginEnvironment = (
	value: string | null | undefined
): value is CanadaLoginEnvironment =>
	CANADA_LOGIN_ENVIRONMENTS.some((environment) => environment === value);

export const ApplicationRPConfigurationCopyPage = (): FunctionComponent => {
	const { t } = useTranslation() as unknown as {
		t: (key: string, options?: Record<string, unknown>) => string;
	};
	const navigate = useNavigate();
	const { applicationInformationUuid, rpConfigurationUuid, workspaceUuid } =
		useParams({
			from: "/workspaces/$workspaceUuid/applications/$applicationInformationUuid/rp-configurations/$rpConfigurationUuid/copy",
		});
	const { configuration, error, isLoading } = useApplicationRPConfiguration(
		workspaceUuid,
		applicationInformationUuid,
		rpConfigurationUuid
	);
	const { copyConfiguration, isCopying } =
		useApplicationRPConfigurationCopyActions();
	const [copyCreationKey] = useState(() => crypto.randomUUID());
	const [targetConfigurationName, setTargetConfigurationName] = useState("");
	const [targetPartnerEnvironment, setTargetPartnerEnvironment] = useState("");
	const [targetEnvironmentOverride, setTargetEnvironmentOverride] =
		useState<CanadaLoginEnvironment | null>(null);
	const [submitted, setSubmitted] = useState(false);
	const [requestError, setRequestError] = useState<Error | null>(null);
	const sourceEnvironment = isCanadaLoginEnvironment(
		configuration?.canadaLoginEnvironment
	)
		? configuration.canadaLoginEnvironment
		: null;
	const targetEnvironment =
		targetEnvironmentOverride ?? sourceEnvironment ?? "test";
	const basePath = `/workspaces/${encodeURIComponent(workspaceUuid)}/applications/${encodeURIComponent(applicationInformationUuid)}/rp-configurations/${encodeURIComponent(rpConfigurationUuid)}`;
	const listPath = `/workspaces/${encodeURIComponent(workspaceUuid)}/applications/${encodeURIComponent(applicationInformationUuid)}/rp-configurations`;
	const nameError =
		submitted && !targetConfigurationName.trim()
			? t("workspaces.rpCopyNameRequired")
			: undefined;
	const partnerEnvironmentError =
		submitted && !targetPartnerEnvironment.trim()
			? t("workspaces.rpCopyPartnerEnvironmentRequired")
			: undefined;
	const errorNotice = getRequestErrorNotice(requestError ?? error, {
		bodyKey: "workspaces.rpCopyErrorBody",
		titleKey: "workspaces.rpCopyErrorTitle",
	});

	const handleSubmit = async (): Promise<void> => {
		setSubmitted(true);
		setRequestError(null);
		if (!targetConfigurationName.trim() || !targetPartnerEnvironment.trim()) {
			return;
		}

		try {
			const copied = await copyConfiguration(
				workspaceUuid,
				applicationInformationUuid,
				rpConfigurationUuid,
				{
					targetConfigurationName,
					targetEnvironment,
					targetPartnerEnvironment,
				},
				copyCreationKey
			);
			await navigate({
				href: `${listPath}/${encodeURIComponent(copied.targetRpConfigurationUuid)}/registration/endpoints`,
				replace: true,
			});
		} catch (submissionError) {
			setRequestError(submissionError as Error);
		}
	};

	return (
		<div className="grid gap-400">
			<div>
				<Heading tag="h1">{t("workspaces.rpCopyTitle")}</Heading>
				<Text>{t("workspaces.rpCopySummary")}</Text>
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

			{configuration && sourceEnvironment ? (
				<form
					className="grid gap-300"
					onSubmit={(event) => {
						event.preventDefault();
						void handleSubmit();
					}}
				>
					<Heading tag="h2">{t("workspaces.rpCopySourceTitle")}</Heading>
					<Grid columns="1fr" columnsDesktop="16rem 1fr" tag="dl">
						<dt>
							<strong>{t("workspaces.rpCopySourceLabel")}</strong>
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
							{getCanadaLoginEnvironmentLabel(t as never, sourceEnvironment)}
						</dd>
					</Grid>

					<Notice
						noticeRole="info"
						noticeTitle={t("workspaces.rpCopyReusableTitle")}
						noticeTitleTag="h2"
					>
						<Text>{t("workspaces.rpCopyReusableBody")}</Text>
					</Notice>
					<Notice
						noticeRole="warning"
						noticeTitle={t("workspaces.rpCopyExcludedTitle")}
						noticeTitleTag="h2"
					>
						<Text>{t("workspaces.rpCopyExcludedBody")}</Text>
					</Notice>

					<Input
						required
						errorMessage={nameError}
						hint={t("workspaces.rpCopyNameHint")}
						inputId="rp-copy-target-name"
						label={t("workspaces.rpCopyNameLabel")}
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
						hint={t("workspaces.rpCopyPartnerEnvironmentHint")}
						inputId="rp-copy-target-partner-environment"
						label={t("workspaces.rpCopyPartnerEnvironmentLabel")}
						maxLength={128}
						name="targetPartnerEnvironment"
						value={targetPartnerEnvironment}
						onInput={(event): void => {
							setTargetPartnerEnvironment(
								(event.target as HTMLInputElement).value
							);
						}}
					/>
					<Select
						label={t("workspaces.rpCopyEnvironmentLabel")}
						name="targetEnvironment"
						selectId="rp-copy-target-environment"
						value={targetEnvironment}
						onInput={(event): void => {
							setTargetEnvironmentOverride(
								(event.target as HTMLSelectElement)
									.value as CanadaLoginEnvironment
							);
						}}
					>
						{CANADA_LOGIN_ENVIRONMENTS.map((environment) => (
							<option key={environment} value={environment}>
								{getCanadaLoginEnvironmentLabel(t as never, environment)}
							</option>
						))}
					</Select>

					{targetEnvironment === "production" ? (
						<Notice
							noticeRole="info"
							noticeTitle={t("workspaces.rpCopyProductionTitle")}
							noticeTitleTag="h2"
						>
							<Text>{t("workspaces.rpCopyProductionBody")}</Text>
						</Notice>
					) : null}

					<div className="flex flex-wrap gap-200">
						<Button disabled={isCopying} type="submit">
							{isCopying
								? t("workspaces.rpCopyCreatingAction")
								: t("workspaces.rpCopyCreateAction")}
						</Button>
						<Button buttonRole="secondary" href={basePath} type="link">
							{t("common.cancel")}
						</Button>
					</div>
				</form>
			) : null}

			<div>
				<Link href={basePath}>{t("workspaces.rpCopyBack")}</Link>
			</div>
		</div>
	);
};
