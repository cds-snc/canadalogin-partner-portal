import { useParams } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import type { FunctionComponent } from "@/common/types";
import { Button, Heading, Notice, Text } from "@/components/ui";
import { useWorkspaceRPApplication } from "../hooks/use-workspace-rp-applications";

export const WorkspaceRPRegistrationConfirmationPage =
	(): FunctionComponent => {
		const { t } = useTranslation() as unknown as {
			t: (
				key: string | Array<string>,
				options?: Record<string, unknown>
			) => string;
		};
		const { rpApplicationUuid, workspaceUuid } = useParams({
			from: "/workspaces/$workspaceUuid/applications/$rpApplicationUuid/registration/confirmation",
		});
		const { application, error, isLoading } = useWorkspaceRPApplication(
			workspaceUuid,
			rpApplicationUuid
		);

		return (
			<>
				<Heading tag="h1">
					{t("workspaces.registration.confirmationTitle")}
				</Heading>
				{isLoading ? (
					<Text>{t("workspaces.registration.loadingBody")}</Text>
				) : null}
				{error ? (
					<Notice
						noticeRole="danger"
						noticeTitle={t("workspaces.registration.errorTitle")}
						noticeTitleTag="h2"
					>
						<Text>{t("workspaces.registration.confirmationRefreshBody")}</Text>
					</Notice>
				) : null}
				{application ? (
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
									name: application.dnrAppName,
									status: application.onboardingState ?? "submitted",
								})}
							</Text>
						</Notice>
						<Text>{t("workspaces.registration.confirmationNextSteps")}</Text>
						<div className="flex flex-wrap gap-200">
							<Button
								href={`/workspaces/${workspaceUuid}/applications/${rpApplicationUuid}`}
								type="link"
							>
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
