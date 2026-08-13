import { useParams } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import type { FunctionComponent } from "@/common/types";
import { Button, Heading, Notice, Text } from "@/components/ui";
import { useApplicationRPConfiguration } from "../hooks/use-application-rp-configurations";

export const WorkspaceRPRegistrationConfirmationPage =
	(): FunctionComponent => {
		const { t } = useTranslation() as unknown as {
			t: (
				key: string | Array<string>,
				options?: Record<string, unknown>
			) => string;
		};
		const params = useParams({ strict: false });
		const applicationInformationUuid =
			params["applicationInformationUuid"] ?? "";
		const rpApplicationUuid =
			params["rpConfigurationUuid"] || params["rpApplicationUuid"] || "";
		const workspaceUuid = params["workspaceUuid"] ?? "";
		const configurationState = useApplicationRPConfiguration(
			workspaceUuid,
			applicationInformationUuid,
			rpApplicationUuid
		);
		const applicationName =
			configurationState.configuration?.configurationName?.trim();
		const onboardingState = configurationState.configuration?.onboardingState;
		const parentPath = `/workspaces/${workspaceUuid}/applications/${applicationInformationUuid}/rp-configurations/${rpApplicationUuid}`;

		return (
			<>
				<Heading tag="h1">
					{t("workspaces.registration.confirmationTitle")}
				</Heading>
				{configurationState.isLoading ? (
					<Text>{t("workspaces.registration.loadingBody")}</Text>
				) : null}
				{configurationState.error ? (
					<Notice
						noticeRole="danger"
						noticeTitle={t("workspaces.registration.errorTitle")}
						noticeTitleTag="h2"
					>
						<Text>{t("workspaces.registration.confirmationRefreshBody")}</Text>
					</Notice>
				) : null}
				{applicationName ? (
					<div className="grid gap-300">
						<Notice
							noticeRole="success"
							noticeTitleTag="h2"
							noticeTitle={t(
								"workspaces.registration.confirmationSuccessTitle"
							)}
						>
							<Text>
								{t("workspaces.registration.confirmationSuccessBody", {
									name: applicationName,
									status: onboardingState ?? "submitted",
								})}
							</Text>
						</Notice>
						<Text>{t("workspaces.registration.confirmationNextSteps")}</Text>
						<div className="flex flex-wrap gap-200">
							<Button href={parentPath} type="link">
								{t("workspaces.registration.applicationDetailAction")}
							</Button>
							<Button
								buttonRole="secondary"
								href={`/workspaces/${workspaceUuid}`}
								type="link"
							>
								{t("workspaces.registration.workspaceHubAction")}
							</Button>
						</div>
					</div>
				) : null}
			</>
		);
	};
