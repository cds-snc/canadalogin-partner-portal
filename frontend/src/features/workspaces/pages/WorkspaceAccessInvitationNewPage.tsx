import { Link, useParams } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { FunctionComponent } from "@/common/types";
import { useDocumentTitle } from "@/common/use-document-title";
import { Button, Heading, Input, Notice, Select, Text } from "@/components/ui";
import {
	isClAdmin,
	ROLE_LABEL_KEYS,
	type PartnerRole,
} from "@/features/auth/authorization";
import { getRequestErrorNotice } from "@/fetch";
import { useSession } from "@/hooks";
import { useWorkspaceAccessInvitations } from "../hooks/use-workspace-access-invitations";

const lowerPartnerRoles: ReadonlyArray<PartnerRole> = [
	"rp_user_edit",
	"read_only",
];
const allPartnerRoles: ReadonlyArray<PartnerRole> = [
	"rp_admin",
	...lowerPartnerRoles,
];
const invitationExpiryFromNow = (days: number): string =>
	new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

export const WorkspaceAccessInvitationNewPage = (): FunctionComponent => {
	const { t } = useTranslation();
	const { currentUser } = useSession();
	const { workspaceUuid } = useParams({
		from: "/workspaces/$workspaceUuid/access/invitations/new",
	});
	const { createInvitation, error, isCreating } =
		useWorkspaceAccessInvitations(workspaceUuid);
	const roles = isClAdmin(currentUser?.authorizationContext)
		? allPartnerRoles
		: lowerPartnerRoles;
	const [email, setEmail] = useState("");
	const [role, setRole] = useState<PartnerRole>("read_only");
	const [expiryDays, setExpiryDays] = useState("7");
	const [createdInvitationUrl, setCreatedInvitationUrl] = useState<
		string | null
	>(null);
	const [localError, setLocalError] = useState<Error | null>(null);
	const title = t("workspaces.accessInvitationCreateTitle");
	useDocumentTitle(title, t("home.title"));
	const errorNotice = getRequestErrorNotice(localError ?? error, {
		bodyKey: "workspaces.accessInvitationsErrorBody",
		titleKey: "workspaces.accessInvitationsErrorTitle",
	});

	const submit = async (): Promise<void> => {
		setCreatedInvitationUrl(null);
		setLocalError(null);
		try {
			const invitation = await createInvitation({
				invitedEmail: email.trim(),
				inviteExpiresAt: invitationExpiryFromNow(Number(expiryDays)),
				role,
			});
			setCreatedInvitationUrl(invitation.acceptanceUrl);
			setEmail("");
		} catch (requestError) {
			setLocalError(requestError as Error);
		}
	};

	return (
		<>
			<Heading tag="h1">{title}</Heading>
			<Text>{t("workspaces.inviteUserTaskDescription")}</Text>
			{errorNotice ? (
				<Notice
					noticeRole={errorNotice.noticeRole}
					noticeTitle={t(errorNotice.titleKey as never)}
					noticeTitleTag="h2"
				>
					<Text>{errorNotice.bodyText ?? t(errorNotice.bodyKey as never)}</Text>
				</Notice>
			) : null}
			{createdInvitationUrl ? (
				<Notice
					noticeRole="success"
					noticeTitle={t("workspaces.accessInvitationLinkTitle")}
					noticeTitleTag="h2"
				>
					<Text>{t("workspaces.accessInvitationLinkBody")}</Text>
					<Text>{createdInvitationUrl}</Text>
				</Notice>
			) : null}
			<form
				className="grid gap-300"
				onSubmit={(event) => {
					event.preventDefault();
					void submit();
				}}
			>
				<Input
					required
					inputId="workspace-invitation-email"
					label={t("workspaces.applicationsInvitationEmailLabel")}
					name="workspace-invitation-email"
					type="email"
					value={email}
					onInput={(event) => {
						setEmail((event.target as HTMLInputElement).value);
					}}
				/>
				<Select
					label={t("workspaces.selectRole")}
					name="workspace-invitation-role"
					selectId="workspace-invitation-role"
					value={role}
					onInput={(event) => {
						setRole((event.target as HTMLSelectElement).value as PartnerRole);
					}}
				>
					{roles.map((invitationRole) => (
						<option key={invitationRole} value={invitationRole}>
							{t(ROLE_LABEL_KEYS[invitationRole] as never)}
						</option>
					))}
				</Select>
				<Select
					label={t("workspaces.accessInvitationExpiryLabel")}
					name="workspace-invitation-expiry"
					selectId="workspace-invitation-expiry"
					value={expiryDays}
					onInput={(event) => {
						setExpiryDays((event.target as HTMLSelectElement).value);
					}}
				>
					<option value="7">
						{t("workspaces.accessInvitationExpirySevenDays")}
					</option>
					<option value="14">
						{t("workspaces.accessInvitationExpiryFourteenDays")}
					</option>
					<option value="30">
						{t("workspaces.accessInvitationExpiryThirtyDays")}
					</option>
				</Select>
				<Button
					disabled={isCreating || email.trim().length === 0}
					type="submit"
				>
					{isCreating
						? t("workspaces.accessInvitationCreatingAction")
						: t("workspaces.accessInvitationCreateAction")}
				</Button>
			</form>
			<Link
				params={{ workspaceUuid }}
				to="/workspaces/$workspaceUuid/access/invitations"
			>
				{t("workspaces.backToInvitationsAction")}
			</Link>
		</>
	);
};
