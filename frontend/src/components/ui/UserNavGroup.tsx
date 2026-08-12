import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { GcdsNavGroup, GcdsNavLink } from "@gcds-core/components-react";
import type { FunctionComponent } from "@/common/types";
import { getDepartment } from "@/fetch/departments";
import { ROLE_LABEL_KEYS } from "@/features/auth/authorization";
import { useDevSession, useSession } from "@/hooks";
import Button from "./Button";
import Notice from "./Notice";

export const UserNavGroup = (): FunctionComponent => {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const { currentUser, refreshSession } = useSession();
	const [clearError, setClearError] = useState(false);
	const { data: department } = useQuery({
		enabled: Boolean(currentUser?.departmentUuid),
		queryFn: () =>
			currentUser?.departmentUuid
				? getDepartment(currentUser.departmentUuid)
				: null,
		queryKey: ["nav-department", currentUser?.departmentUuid],
	});
	const { clearSession, currentFixture, isClearing } = useDevSession({
		enabled: Boolean(currentUser),
	});

	if (!currentUser) {
		return null;
	}

	const fixtureWorkspaceNamesByUuid = new Map(
		(currentFixture?.partnerAccess ?? []).map((access) => [
			access.workspaceUuid,
			access.workspaceName,
		])
	);
	const roleContexts = currentUser.authorizationContext.globalRole
		? [
				{
					label: String(
						t(
							ROLE_LABEL_KEYS[
								currentUser.authorizationContext.globalRole
							] as never
						)
					),
					workspaceName: null,
					workspaceUuid: null,
				},
			]
		: currentUser.authorizationContext.partnerAccess.map((access) => ({
				label: String(t(ROLE_LABEL_KEYS[access.role] as never)),
				workspaceName: fixtureWorkspaceNamesByUuid.get(access.workspaceUuid),
				workspaceUuid: access.workspaceUuid,
			}));

	const departmentLabel =
		department?.name ??
		currentUser.departmentAbbreviation ??
		t("yourApplications.noDepartment");

	const handleClearSimulatedSession = async (): Promise<void> => {
		setClearError(false);

		try {
			await clearSession();
			await refreshSession();
			await navigate({ replace: true, to: "/" });
		} catch {
			setClearError(true);
		}
	};

	return (
		<GcdsNavGroup menuLabel={currentUser.name} openTrigger={currentUser.name}>
			<li>
				<div className="px-400 py-300 text-sm">
					<p>{currentUser.email}</p>
					<p className="mt-100 text-[var(--gcds-text-secondary)]">
						<strong>{t("nav.organization")}:</strong>
						<br />
						{departmentLabel}
					</p>
					{roleContexts.length > 0 ? (
						<div className="mt-100 text-[var(--gcds-text-secondary)]">
							<p className="mb-100">
								<strong>{t("nav.roles")}:</strong>
							</p>
							<ul className="flex flex-wrap gap-100">
								{roleContexts.map((roleContext) => (
									<li
										key={`${roleContext.label}-${roleContext.workspaceUuid ?? "global"}`}
										className="rounded-full border border-[var(--gcds-border-default)] bg-[rgba(255,255,255,0.88)] px-200 py-100 text-xs text-[var(--gcds-text-primary)]"
									>
										{roleContext.workspaceUuid && roleContext.workspaceName
											? t("authorization.workspaceRoleNameContext", {
													role: roleContext.label,
													workspaceName: roleContext.workspaceName,
												})
											: roleContext.label}
									</li>
								))}
							</ul>
						</div>
					) : null}
					{currentFixture ? (
						<div className="mt-200 border-t border-[var(--gcds-border-default)] pt-200 text-[var(--gcds-text-primary)]">
							<p>
								<strong>{t("localDevPersona.simulatedSessionLabel")}</strong>
							</p>
							<p className="mt-100 text-[var(--gcds-text-secondary)]">
								{t("localDevPersona.simulatedIdentity", {
									email: currentFixture.email,
									name: currentFixture.name,
								})}
							</p>
							<Button
								buttonId="clear-local-simulated-session"
								buttonRole="secondary"
								className="mt-200"
								disabled={isClearing}
								size="small"
								type="button"
								onGcdsClick={() => {
									void handleClearSimulatedSession();
								}}
							>
								{isClearing
									? t("localDevPersona.clearingAction")
									: t("localDevPersona.clearAction")}
							</Button>
							{clearError ? (
								<Notice
									className="mt-100"
									noticeRole="danger"
									noticeTitle={t("localDevPersona.clearErrorTitle")}
									noticeTitleTag="h4"
								>
									<p>{t("localDevPersona.clearErrorBody")}</p>
								</Notice>
							) : null}
						</div>
					) : null}
				</div>
			</li>
			<GcdsNavLink href="/logout">{t("nav.logout")}</GcdsNavLink>
		</GcdsNavGroup>
	);
};
