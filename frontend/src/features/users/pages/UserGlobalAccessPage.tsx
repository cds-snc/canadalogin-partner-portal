import { Link, useParams } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { FunctionComponent } from "@/common/types";
import { useDocumentTitle } from "@/common/use-document-title";
import { Button, ConfirmDialog, Heading, Notice, Text } from "@/components/ui";
import { getRequestErrorNotice } from "@/fetch";
import { useUserAccessAdministration } from "../hooks/use-user-access-administration";

export const UserGlobalAccessPage = (): FunctionComponent => {
	const { t } = useTranslation();
	const { userUuid } = useParams({ from: "/users/$userUuid/global-access" });
	const { access, assignGlobal, error, isLoading, isMutating, revokeGlobal } =
		useUserAccessAdministration(userUuid);
	const [confirmRevoke, setConfirmRevoke] = useState(false);
	const [successMessage, setSuccessMessage] = useState<string | null>(null);
	const title = t("users.globalAccessPageTitle");
	useDocumentTitle(title, t("home.title"));
	const errorNotice = getRequestErrorNotice(error, {
		bodyKey: "users.accessErrorBody",
		titleKey: "users.accessErrorTitle",
	});

	const runMutation = async (
		action: () => Promise<unknown>,
		messageKey: string
	): Promise<void> => {
		try {
			await action();
		} catch {
			return;
		}
		setSuccessMessage(t(messageKey as never));
	};

	return (
		<>
			<Heading tag="h1">{title}</Heading>
			<Text>{t("users.globalAccessSummary")}</Text>
			{isLoading ? <Text>{t("users.accessLoadingBody")}</Text> : null}
			{errorNotice ? (
				<Notice
					noticeRole={errorNotice.noticeRole}
					noticeTitle={t(errorNotice.titleKey as never)}
					noticeTitleTag="h2"
				>
					<Text>{errorNotice.bodyText ?? t(errorNotice.bodyKey as never)}</Text>
				</Notice>
			) : null}
			{successMessage ? (
				<Notice
					noticeRole="success"
					noticeTitle={successMessage}
					noticeTitleTag="h2"
				>
					<Text>{successMessage}</Text>
				</Notice>
			) : null}
			{access ? (
				<section className="grid gap-200">
					<Heading tag="h2">{t("users.currentGlobalAccessTitle")}</Heading>
					<Text>
						{access.globalAssignment
							? t("users.clAdminAssignedBody")
							: t("users.noCanonicalGlobalRole")}
					</Text>
					{access.globalAssignment ? (
						<Button
							buttonRole="danger"
							disabled={isMutating}
							type="button"
							onGcdsClick={() => {
								setConfirmRevoke(true);
							}}
						>
							{t("users.revokeAction")}
						</Button>
					) : access.workspaceAssignments.length > 0 ? (
						<Notice
							noticeRole="warning"
							noticeTitle={t("users.clAdminIneligibleActivePartnerAccessTitle")}
							noticeTitleTag="h3"
						>
							<Text>{t("users.clAdminIneligibleActivePartnerAccessBody")}</Text>
						</Notice>
					) : (
						<Button
							disabled={isMutating || !access.user.enabled}
							type="button"
							onGcdsClick={() => {
								void runMutation(assignGlobal, "users.clAdminAssignedSuccess");
							}}
						>
							{t("users.assignClAdminAction")}
						</Button>
					)}
				</section>
			) : null}
			<Link params={{ userUuid }} to="/users/$userUuid">
				{t("users.backToSelectedUserAction")}
			</Link>
			<ConfirmDialog
				cancelLabel={t("users.cancelAction")}
				confirmLabel={t("users.confirmRevokeAction")}
				description={t("users.revokeGlobalDialogBody")}
				isOpen={confirmRevoke}
				title={t("users.revokeGlobalDialogTitle")}
				onClose={() => {
					setConfirmRevoke(false);
				}}
				onConfirm={() => {
					void runMutation(revokeGlobal, "users.accessRevokedSuccess").then(
						() => {
							setConfirmRevoke(false);
						}
					);
				}}
			/>
		</>
	);
};
