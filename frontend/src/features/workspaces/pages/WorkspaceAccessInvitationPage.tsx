import { Link, useParams } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { FunctionComponent } from "@/common/types";
import { useDocumentTitle } from "@/common/use-document-title";
import { Button, ConfirmDialog, Heading, Notice, Text } from "@/components/ui";
import { ROLE_LABEL_KEYS } from "@/features/auth/authorization";
import { getRequestErrorNotice } from "@/fetch";
import { formatLocalizedDate } from "@/common/format-localized-date";
import { InvitationLinkNotice } from "@/features/invitations/components/InvitationLinkNotice";
import { useWorkspaceAccessInvitation } from "../hooks/use-workspace-access-invitation";

const invitationStatusLabelKeys = {
	accepted: "workspaces.applicationsInvitationStatusAccepted",
	expired: "workspaces.applicationsInvitationStatusExpired",
	pending: "workspaces.applicationsInvitationStatusPending",
	revoked: "workspaces.applicationsInvitationStatusRevoked",
} as const;
const invitationExpiryFromNow = (days: number): string =>
	new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

export const WorkspaceAccessInvitationPage = (): FunctionComponent => {
	const { i18n, t } = useTranslation();
	const { invitationUuid, workspaceUuid } = useParams({
		from: "/workspaces/$workspaceUuid/access/invitations/$invitationUuid",
	});
	const {
		error,
		invitation,
		isLoading,
		isReissuing,
		isRevoking,
		reissueInvitation,
		revokeInvitation,
	} = useWorkspaceAccessInvitation(workspaceUuid, invitationUuid);
	const [confirmAction, setConfirmAction] = useState<
		"reissue" | "revoke" | null
	>(null);
	const [createdInvitationUrl, setCreatedInvitationUrl] = useState<
		string | null
	>(null);
	const [localError, setLocalError] = useState<Error | null>(null);
	const [successMessage, setSuccessMessage] = useState<string | null>(null);
	const title = invitation
		? t("workspaces.invitationPageTitle", { email: invitation.invitedEmail })
		: t("workspaces.invitationPageLoadingTitle");
	useDocumentTitle(title, t("home.title"));
	const errorNotice = getRequestErrorNotice(localError ?? error, {
		bodyKey: "workspaces.accessInvitationsErrorBody",
		titleKey: "workspaces.accessInvitationsErrorTitle",
	});

	const revoke = async (): Promise<void> => {
		if (!invitation || invitation.status !== "pending") return;
		setLocalError(null);
		try {
			await revokeInvitation();
		} catch (requestError) {
			setLocalError(requestError as Error);
			return;
		}
		setConfirmAction(null);
		setSuccessMessage(t("workspaces.accessInvitationRevokedSuccess"));
	};

	const reissue = async (): Promise<void> => {
		if (!invitation || invitation.status === "accepted") return;
		setCreatedInvitationUrl(null);
		setLocalError(null);
		try {
			const nextInvitation = await reissueInvitation({
				inviteExpiresAt: invitationExpiryFromNow(7),
			});
			setCreatedInvitationUrl(nextInvitation.acceptanceUrl);
		} catch (requestError) {
			setLocalError(requestError as Error);
			return;
		}
		setConfirmAction(null);
		setSuccessMessage(t("workspaces.accessInvitationReissuedSuccess"));
	};

	return (
		<>
			<Heading tag="h1">{title}</Heading>
			{isLoading ? (
				<Text>{t("workspaces.accessInvitationsLoadingBody")}</Text>
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
			{successMessage && !createdInvitationUrl ? (
				<Notice
					noticeRole="success"
					noticeTitle={successMessage}
					noticeTitleTag="h2"
				>
					<Text>{successMessage}</Text>
				</Notice>
			) : null}
			{createdInvitationUrl ? (
				<InvitationLinkNotice
					acceptanceUrl={createdInvitationUrl}
					title={t("workspaces.accessInvitationLinkTitle")}
				/>
			) : null}
			{!isLoading && !error && !invitation ? (
				<Notice
					noticeRole="warning"
					noticeTitle={t("workspaces.accessRecordUnavailableTitle")}
					noticeTitleTag="h2"
				>
					<Text>{t("workspaces.accessRecordUnavailableBody")}</Text>
				</Notice>
			) : null}
			{invitation ? (
				<section className="grid gap-200">
					<Heading tag="h2">{t("workspaces.invitationDetailsTitle")}</Heading>
					{invitation.status !== "accepted" && !createdInvitationUrl ? (
						<Notice
							noticeRole="info"
							noticeTitle={t("invitations.manualDelivery.unavailableTitle")}
							noticeTitleTag="h3"
						>
							<Text>{t("invitations.manualDelivery.unavailableBody")}</Text>
						</Notice>
					) : null}
					<Text>{invitation.invitedEmail}</Text>
					<Text>
						{`${t("workspaces.applicationsInvitationRoleLabel")}: ${String(t(ROLE_LABEL_KEYS[invitation.role] as never))}`}
					</Text>
					<Text>
						{`${t("workspaces.applicationsInvitationStatusLabel")}: ${String(t(invitationStatusLabelKeys[invitation.status] as never))}`}
					</Text>
					<Text>
						{`${t("workspaces.applicationsInvitationExpiresAtDisplayLabel")}: ${formatLocalizedDate(invitation.inviteExpiresAt, i18n.language)}`}
					</Text>
					<div className="flex flex-wrap gap-200">
						{invitation.status !== "accepted" ? (
							<Button
								buttonRole="secondary"
								disabled={isReissuing}
								type="button"
								onGcdsClick={() => {
									setConfirmAction("reissue");
								}}
							>
								{t("workspaces.accessInvitationReissueAction")}
							</Button>
						) : null}
						{invitation.status === "pending" ? (
							<Button
								buttonRole="danger"
								disabled={isRevoking}
								type="button"
								onGcdsClick={() => {
									setConfirmAction("revoke");
								}}
							>
								{t("workspaces.applicationsInvitationRevokeAction")}
							</Button>
						) : null}
					</div>
				</section>
			) : null}
			<Link
				params={{ workspaceUuid }}
				to="/workspaces/$workspaceUuid/access/invitations"
			>
				{t("workspaces.backToInvitationsAction")}
			</Link>
			<ConfirmDialog
				cancelLabel={t("common.cancel")}
				confirmLabel={t("workspaces.accessInvitationReissueAction")}
				isOpen={confirmAction === "reissue"}
				isPending={isReissuing}
				title={t("workspaces.accessInvitationReissueConfirmTitle")}
				description={t("workspaces.accessInvitationReissueConfirmBody", {
					email: invitation?.invitedEmail ?? "",
				})}
				onConfirm={() => void reissue()}
				onClose={() => {
					setConfirmAction(null);
				}}
			/>
			<ConfirmDialog
				cancelLabel={t("common.cancel")}
				confirmLabel={t("workspaces.applicationsInvitationRevokeAction")}
				isOpen={confirmAction === "revoke"}
				isPending={isRevoking}
				title={t("workspaces.accessInvitationRevokeConfirmTitle")}
				description={t("workspaces.accessInvitationRevokeConfirmBody", {
					email: invitation?.invitedEmail ?? "",
				})}
				onConfirm={() => void revoke()}
				onClose={() => {
					setConfirmAction(null);
				}}
			/>
		</>
	);
};
