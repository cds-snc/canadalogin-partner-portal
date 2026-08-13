import { useState } from "react";
import { useNavigate, useParams } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import type { FunctionComponent } from "@/common/types";
import { Button, ConfirmDialog, Heading, Notice, Text } from "@/components/ui";
import { getRequestErrorNotice } from "@/fetch";
import { useApplicationInformationManagement } from "../hooks/use-application-information-management";
import { useWorkspaceApplicationInformation } from "../hooks/use-workspace-application-information";

export const ApplicationInformationDeletePage = (): FunctionComponent => {
	const { i18n, t } = useTranslation() as unknown as {
		i18n: { resolvedLanguage?: string };
		t: (
			key: string | Array<string>,
			options?: Record<string, unknown>
		) => string;
	};
	const navigate = useNavigate();
	const { applicationInformationUuid, workspaceUuid } = useParams({
		from: "/workspaces/$workspaceUuid/applications/$applicationInformationUuid/delete",
	});
	const { applicationInformation, error, isLoading } =
		useWorkspaceApplicationInformation(
			workspaceUuid,
			applicationInformationUuid
		);
	const { deleteApplicationInformation, isDeleting } =
		useApplicationInformationManagement();
	const [isDeleteOpen, setIsDeleteOpen] = useState(false);
	const [localError, setLocalError] = useState<Error | null>(null);
	const errorNotice = getRequestErrorNotice(localError ?? error, {
		bodyKey: "workspaces.appInfoErrorBody",
		titleKey: "workspaces.appInfoErrorTitle",
	});
	const localizedName = applicationInformation
		? i18n.resolvedLanguage?.startsWith("fr")
			? applicationInformation.serviceNameFr
			: applicationInformation.serviceNameEn
		: "";

	const handleDelete = async (): Promise<void> => {
		setLocalError(null);
		try {
			await deleteApplicationInformation(
				workspaceUuid,
				applicationInformationUuid
			);
			await navigate({
				params: { workspaceUuid },
				replace: true,
				search: { deleted: "1" },
				to: "/workspaces/$workspaceUuid/applications",
			});
		} catch (requestError) {
			setIsDeleteOpen(false);
			setLocalError(requestError as Error);
		}
	};

	return (
		<>
			<Heading tag="h1">{t("workspaces.appInfoDelete")}</Heading>
			<Text>{t("workspaces.appInfoDeleteDescription")}</Text>

			{isLoading ? (
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

			{applicationInformation ? (
				<div className="mt-300">
					<Button
						buttonRole="danger"
						type="button"
						onGcdsClick={() => {
							setIsDeleteOpen(true);
						}}
					>
						{t("workspaces.appInfoDelete")}
					</Button>
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

			<ConfirmDialog
				cancelLabel={t("workspaces.cancelAction")}
				confirmLabel={t("workspaces.appInfoDelete")}
				isOpen={isDeleteOpen}
				isPending={isDeleting}
				title={t("workspaces.appInfoDeleteConfirmTitle")}
				description={t("workspaces.appInfoDeleteConfirmBody", {
					name: localizedName,
				})}
				onClose={() => {
					setIsDeleteOpen(false);
				}}
				onConfirm={() => {
					void handleDelete();
				}}
			/>
		</>
	);
};
