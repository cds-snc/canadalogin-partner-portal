import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import type { FunctionComponent } from "@/common/types";
import { useDocumentTitle } from "@/common/use-document-title";
import { Button, Heading, Input, Notice, Select, Text } from "@/components/ui";
import {
	ROLE_LABEL_KEYS,
	type PartnerRole,
} from "@/features/auth/authorization";
import { getRequestErrorNotice } from "@/fetch";
import { useWorkspaces } from "@/features/workspaces/hooks/use-workspaces";
import { useInviteUser } from "../hooks/use-invite-user";

const invitationRoles: ReadonlyArray<PartnerRole> = [
	"rp_admin",
	"rp_user_edit",
	"read_only",
];

export const InviteUserPage = (): FunctionComponent => {
	const { t } = useTranslation();
	const navigate = useNavigate();
	useDocumentTitle(t("users.inviteTitle"), t("home.title"));
	const { error, invite, isInviting } = useInviteUser();
	const { error: workspacesError, isLoading, workspaces } = useWorkspaces();
	const [email, setEmail] = useState("");
	const [workspaceUuid, setWorkspaceUuid] = useState("");
	const [role, setRole] = useState<PartnerRole>("read_only");
	const [expiryDays, setExpiryDays] = useState("7");
	const [acceptanceUrl, setAcceptanceUrl] = useState<string | null>(null);
	const [ineligible, setIneligible] = useState(false);
	const errorNotice = getRequestErrorNotice(error ?? workspacesError, {
		bodyKey: "users.inviteErrorBody",
		titleKey: "users.inviteErrorTitle",
	});
	const canSubmit =
		email.trim().length > 0 && workspaceUuid.length > 0 && !isInviting;

	const submit = async (): Promise<void> => {
		setAcceptanceUrl(null);
		setIneligible(false);
		let result: Awaited<ReturnType<typeof invite>>;
		try {
			result = await invite({
				invitedEmail: email.trim(),
				inviteExpiresAt: new Date(
					Date.now() + Number(expiryDays) * 24 * 60 * 60 * 1000
				).toISOString(),
				role,
				workspaceUuid,
			});
		} catch {
			return;
		}
		if (result.kind === "existing_identity") {
			await navigate({
				params: { userUuid: result.userUuid },
				to: "/users/$userUuid",
			});
			return;
		}
		if (result.kind === "ineligible_identity") {
			setIneligible(true);
			return;
		}
		setAcceptanceUrl(result.acceptanceUrl);
	};

	return (
		<>
			<Heading tag="h1">{t("users.inviteTitle")}</Heading>
			<Text>{t("users.inviteSummary")}</Text>
			{isLoading ? <Text>{t("users.inviteLoadingWorkspaces")}</Text> : null}
			{errorNotice ? (
				<Notice
					noticeRole={errorNotice.noticeRole}
					noticeTitle={t(errorNotice.titleKey as never)}
					noticeTitleTag="h2"
				>
					<Text>{errorNotice.bodyText ?? t(errorNotice.bodyKey as never)}</Text>
				</Notice>
			) : null}
			{ineligible ? (
				<Notice
					noticeRole="warning"
					noticeTitle={t("users.inviteIneligibleTitle")}
					noticeTitleTag="h2"
				>
					<Text>{t("users.inviteIneligibleBody")}</Text>
				</Notice>
			) : null}
			{acceptanceUrl ? (
				<Notice
					noticeRole="success"
					noticeTitle={t("users.inviteSuccessTitle")}
					noticeTitleTag="h2"
				>
					<Text>{t("users.inviteSuccessBody")}</Text>
					<Text>{acceptanceUrl}</Text>
				</Notice>
			) : null}
			<div className="grid max-w-3xl gap-300">
				<Input
					required
					inputId="invite-user-email"
					label={t("users.emailLabel")}
					name="invite-user-email"
					type="email"
					value={email}
					onInput={(event): void => {
						setEmail((event.target as HTMLInputElement).value);
					}}
				/>
				<Select
					required
					label={t("users.inviteWorkspaceLabel")}
					name="invite-user-workspace"
					selectId="invite-user-workspace"
					value={workspaceUuid}
					onInput={(event): void => {
						setWorkspaceUuid((event.target as HTMLSelectElement).value);
					}}
				>
					<option value="">{t("users.inviteWorkspacePlaceholder")}</option>
					{workspaces.map((workspace) => (
						<option key={workspace.uuid} value={workspace.uuid}>
							{workspace.name}
						</option>
					))}
				</Select>
				<Select
					label={t("users.roleLabel")}
					name="invite-user-role"
					selectId="invite-user-role"
					value={role}
					onInput={(event): void => {
						setRole((event.target as HTMLSelectElement).value as PartnerRole);
					}}
				>
					{invitationRoles.map((candidateRole) => (
						<option key={candidateRole} value={candidateRole}>
							{t(ROLE_LABEL_KEYS[candidateRole] as never)}
						</option>
					))}
				</Select>
				<Select
					label={t("users.inviteExpiryLabel")}
					name="invite-user-expiry"
					selectId="invite-user-expiry"
					value={expiryDays}
					onInput={(event): void => {
						setExpiryDays((event.target as HTMLSelectElement).value);
					}}
				>
					<option value="7">{t("users.inviteExpirySevenDays")}</option>
					<option value="14">{t("users.inviteExpiryFourteenDays")}</option>
					<option value="30">{t("users.inviteExpiryThirtyDays")}</option>
				</Select>
				<div className="flex flex-wrap gap-200">
					<Button
						disabled={!canSubmit}
						type="button"
						onGcdsClick={() => {
							void submit();
						}}
					>
						{isInviting ? t("users.invitingAction") : t("users.inviteAction")}
					</Button>
					<Button buttonRole="secondary" href="/users" type="link">
						{t("users.cancelAction")}
					</Button>
				</div>
			</div>
		</>
	);
};
