import { useState } from "react";
import { useNavigate, useParams } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import type { FunctionComponent } from "@/common/types";
import { Button, ConfirmDialog, Heading, Notice, Text } from "@/components/ui";
import { deleteApplicationRPConfiguration } from "@/fetch/rp-applications";
import { useApplicationRPConfiguration } from "../hooks/use-application-rp-configurations";
import { getWorkspaceOnboardingStateLabel } from "../onboarding-display";

export const ApplicationRPConfigurationSettingsPage = (): FunctionComponent => {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const { applicationInformationUuid, rpConfigurationUuid, workspaceUuid } =
		useParams({
			from: "/workspaces/$workspaceUuid/applications/$applicationInformationUuid/rp-configurations/$rpConfigurationUuid/settings",
		});
	const { configuration, error, isLoading } = useApplicationRPConfiguration(
		workspaceUuid,
		applicationInformationUuid,
		rpConfigurationUuid
	);
	const [isConfirmOpen, setIsConfirmOpen] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);
	const [deleteError, setDeleteError] = useState(false);
	const configurationName =
		configuration?.configurationName?.trim() ||
		t("workspaces.rpConfigurationTitle");

	const handleDelete = async (): Promise<void> => {
		setIsDeleting(true);
		setDeleteError(false);
		try {
			await deleteApplicationRPConfiguration(
				workspaceUuid,
				applicationInformationUuid,
				rpConfigurationUuid
			);
			await navigate({
				href: `/workspaces/${workspaceUuid}/applications/${applicationInformationUuid}/rp-configurations`,
			});
		} catch {
			setDeleteError(true);
		} finally {
			setIsDeleting(false);
			setIsConfirmOpen(false);
		}
	};

	return (
		<div className="grid gap-400">
			<div>
				<Heading tag="h1">
					{t("workspaces.rpSettingsPageTitle", { name: configurationName })}
				</Heading>
				<Text>{t("workspaces.rpSettingsSummary")}</Text>
			</div>

			{isLoading ? (
				<Text>{t("workspaces.applicationsLoadingBody")}</Text>
			) : null}
			{error ? (
				<Notice
					noticeRole="danger"
					noticeTitle={t("workspaces.rpConfigurationErrorTitle")}
					noticeTitleTag="h2"
				>
					<Text>{t("workspaces.rpConfigurationErrorBody")}</Text>
				</Notice>
			) : null}

			{configuration ? (
				<section className="grid gap-200">
					<Heading tag="h2">{t("workspaces.rpSettingsLifecycleTitle")}</Heading>
					<Text>
						{t("workspaces.onboardingStateLabel")}:{" "}
						{configuration.onboardingState
							? getWorkspaceOnboardingStateLabel(
									t as never,
									configuration.onboardingState
								)
							: t("common.notAvailable")}
					</Text>
				</section>
			) : null}

			{deleteError ? (
				<Notice
					noticeRole="danger"
					noticeTitle={t("workspaces.rpSettingsDeleteErrorTitle")}
					noticeTitleTag="h2"
				>
					<Text>{t("workspaces.rpSettingsDeleteErrorBody")}</Text>
				</Notice>
			) : null}

			{configuration ? (
				<section className="grid gap-200 border-t border-[var(--gcds-border-default)] pt-300">
					<Heading tag="h2">{t("workspaces.rpSettingsDeleteTitle")}</Heading>
					<Text>{t("workspaces.rpSettingsDeleteSummary")}</Text>
					<div>
						<Button
							buttonRole="danger"
							type="button"
							onGcdsClick={() => {
								setIsConfirmOpen(true);
							}}
						>
							{t("workspaces.rpSettingsDeleteAction")}
						</Button>
					</div>
				</section>
			) : null}

			<ConfirmDialog
				cancelLabel={t("common.cancel")}
				confirmLabel={t("common.delete")}
				isOpen={isConfirmOpen}
				isPending={isDeleting}
				title={t("workspaces.rpSettingsDeleteConfirmTitle")}
				description={t("workspaces.rpSettingsDeleteConfirmBody", {
					name: configurationName,
				})}
				onClose={() => {
					setIsConfirmOpen(false);
				}}
				onConfirm={() => {
					void handleDelete();
				}}
			/>
		</div>
	);
};
