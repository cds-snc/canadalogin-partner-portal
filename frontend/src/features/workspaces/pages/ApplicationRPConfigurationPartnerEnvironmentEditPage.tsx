import { useState } from "react";
import { useNavigate, useParams } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import type { FunctionComponent } from "@/common/types";
import {
	Button,
	ErrorSummary,
	Heading,
	Input,
	Link,
	Notice,
	Text,
} from "@/components/ui";
import { getRequestErrorNotice } from "@/fetch";
import type { ApplicationRPConfigurationSummaryRead } from "@/fetch/rp-applications";
import {
	useApplicationRPConfiguration,
	useApplicationRPConfigurationPartnerEnvironmentActions,
} from "../hooks/use-application-rp-configurations";

type PartnerEnvironmentFormProps = {
	basePath: string;
	configuration: ApplicationRPConfigurationSummaryRead;
	applicationInformationUuid: string;
	rpConfigurationUuid: string;
	workspaceUuid: string;
};

const PartnerEnvironmentForm = ({
	applicationInformationUuid,
	basePath,
	configuration,
	rpConfigurationUuid,
	workspaceUuid,
}: PartnerEnvironmentFormProps): FunctionComponent => {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const { isUpdating, updatePartnerEnvironment } =
		useApplicationRPConfigurationPartnerEnvironmentActions();
	const [partnerEnvironment, setPartnerEnvironment] = useState(
		configuration.partnerEnvironment ?? ""
	);
	const [submitted, setSubmitted] = useState(false);
	const [requestError, setRequestError] = useState<Error | null>(null);
	const validationMessage =
		submitted && !partnerEnvironment.trim()
			? t("workspaces.rpPartnerEnvironmentRequired")
			: undefined;
	const errorNotice = getRequestErrorNotice(requestError, {
		bodyKey: "workspaces.rpPartnerEnvironmentErrorBody",
		titleKey: "workspaces.rpPartnerEnvironmentErrorTitle",
	});

	return (
		<form
			className="grid gap-300"
			onSubmit={(event) => {
				event.preventDefault();
				setSubmitted(true);
				setRequestError(null);
				if (!partnerEnvironment.trim()) return;
				void updatePartnerEnvironment(
					workspaceUuid,
					applicationInformationUuid,
					rpConfigurationUuid,
					{ partnerEnvironment }
				)
					.then(async () => {
						await navigate({ href: basePath, replace: true });
					})
					.catch((error: unknown) => {
						setRequestError(error as Error);
					});
			}}
		>
			{validationMessage ? (
				<ErrorSummary
					focusOnRender
					heading={t("workspaces.rpPartnerEnvironmentValidationSummary")}
					errorLinks={{
						"rp-partner-environment": validationMessage,
					}}
				/>
			) : null}
			{errorNotice ? (
				<Notice
					noticeRole={errorNotice.noticeRole}
					noticeTitle={t(errorNotice.titleKey as never)}
					noticeTitleTag="h2"
				>
					<Text>{errorNotice.bodyText ?? t(errorNotice.bodyKey as never)}</Text>
				</Notice>
			) : null}
			<Input
				required
				errorMessage={validationMessage}
				hint={t("workspaces.applicationsPartnerEnvironmentHint")}
				inputId="rp-partner-environment"
				label={t("workspaces.applicationsPartnerEnvironmentLabel")}
				maxLength={128}
				name="partnerEnvironment"
				value={partnerEnvironment}
				onInput={(event): void => {
					setPartnerEnvironment((event.target as HTMLInputElement).value);
					if (submitted) setSubmitted(false);
				}}
			/>
			<div className="flex flex-wrap gap-200">
				<Button disabled={isUpdating} type="submit">
					{isUpdating
						? t("workspaces.rpPartnerEnvironmentSavingAction")
						: t("workspaces.rpPartnerEnvironmentSaveAction")}
				</Button>
				<Button buttonRole="secondary" href={basePath} type="link">
					{t("common.cancel")}
				</Button>
			</div>
		</form>
	);
};

export const ApplicationRPConfigurationPartnerEnvironmentEditPage =
	(): FunctionComponent => {
		const { t } = useTranslation();
		const { applicationInformationUuid, rpConfigurationUuid, workspaceUuid } =
			useParams({
				from: "/workspaces/$workspaceUuid/applications/$applicationInformationUuid/rp-configurations/$rpConfigurationUuid/partner-environment/edit",
			});
		const { configuration, error, isLoading } = useApplicationRPConfiguration(
			workspaceUuid,
			applicationInformationUuid,
			rpConfigurationUuid
		);
		const basePath = `/workspaces/${encodeURIComponent(workspaceUuid)}/applications/${encodeURIComponent(applicationInformationUuid)}/rp-configurations/${encodeURIComponent(rpConfigurationUuid)}`;
		const errorNotice = getRequestErrorNotice(error, {
			bodyKey: "workspaces.rpConfigurationErrorBody",
			titleKey: "workspaces.rpConfigurationErrorTitle",
		});

		return (
			<div className="grid gap-400">
				<div>
					<Heading tag="h1">
						{t("workspaces.rpPartnerEnvironmentPageTitle")}
					</Heading>
					<Text>{t("workspaces.rpPartnerEnvironmentSummary")}</Text>
				</div>
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
						noticeTitle={t(errorNotice.titleKey as never)}
						noticeTitleTag="h2"
					>
						<Text>
							{errorNotice.bodyText ?? t(errorNotice.bodyKey as never)}
						</Text>
					</Notice>
				) : null}
				{configuration ? (
					<PartnerEnvironmentForm
						applicationInformationUuid={applicationInformationUuid}
						basePath={basePath}
						configuration={configuration}
						rpConfigurationUuid={rpConfigurationUuid}
						workspaceUuid={workspaceUuid}
					/>
				) : null}
				<div>
					<Link href={basePath}>
						{t("workspaces.rpPartnerEnvironmentBack")}
					</Link>
				</div>
			</div>
		);
	};
