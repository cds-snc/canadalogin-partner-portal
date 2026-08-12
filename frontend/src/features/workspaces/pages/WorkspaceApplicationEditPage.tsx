import { useEffect } from "react";
import { useNavigate, useParams } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import type { FunctionComponent } from "@/common/types";
import { Button, Heading, Notice, Text } from "@/components/ui";
import { useWorkspaceRPApplication } from "../hooks/use-workspace-rp-applications";
import { useWorkspaceRPRegistrationDraft } from "../hooks/use-workspace-rp-registration";
import {
	getEarliestIncompleteRegistrationStep,
	getWorkspaceRPRegistrationStepPath,
} from "../workspace-rp-registration-flow";

export const WorkspaceApplicationEditPage = (): FunctionComponent => {
	const { t } = useTranslation() as unknown as {
		t: (
			key: string | Array<string>,
			options?: Record<string, unknown>
		) => string;
	};
	const navigate = useNavigate();
	const { rpApplicationUuid, workspaceUuid } = useParams({
		from: "/workspaces/$workspaceUuid/applications/$rpApplicationUuid/edit",
	});
	const { application, error, isLoading } = useWorkspaceRPApplication(
		workspaceUuid,
		rpApplicationUuid
	);
	const state = application?.onboardingState?.trim() || "draft";
	const {
		draft,
		error: draftError,
		isLoading: isDraftLoading,
	} = useWorkspaceRPRegistrationDraft(
		state === "draft" ? workspaceUuid : "",
		state === "draft" ? rpApplicationUuid : ""
	);

	useEffect(() => {
		if (!draft) return;
		void navigate({
			href: getWorkspaceRPRegistrationStepPath(
				workspaceUuid,
				rpApplicationUuid,
				getEarliestIncompleteRegistrationStep(
					draft.registrationLastCompletedStep ?? null
				)
			),
			replace: true,
		});
	}, [draft, navigate, rpApplicationUuid, workspaceUuid]);

	return (
		<>
			<Heading tag="h1">
				{t("workspaces.applicationsEditPageTitle", {
					name:
						application?.dnrAppName ?? t("workspaces.applicationsSectionTitle"),
				})}
			</Heading>
			{isLoading || (state === "draft" && isDraftLoading) ? (
				<Notice
					noticeRole="info"
					noticeTitle={t("workspaces.registration.loadingTitle")}
					noticeTitleTag="h2"
				>
					<Text>{t("workspaces.registration.loadingBody")}</Text>
				</Notice>
			) : null}
			{error || draftError ? (
				<Notice
					noticeRole="danger"
					noticeTitle={t("workspaces.registration.errorTitle")}
					noticeTitleTag="h2"
				>
					<Text>{t("workspaces.registration.errorBody")}</Text>
				</Notice>
			) : null}
			{application && state !== "draft" ? (
				<div className="grid gap-300">
					<Notice
						noticeRole="info"
						noticeTitle={t("workspaces.registration.lockedTitle")}
						noticeTitleTag="h2"
					>
						<Text>
							{t("workspaces.registration.lockedBody", { status: state })}
						</Text>
					</Notice>
					<Button
						href={`/workspaces/${workspaceUuid}/applications/${rpApplicationUuid}`}
						type="link"
					>
						{t("workspaces.applicationsBackToDetail")}
					</Button>
				</div>
			) : null}
		</>
	);
};
