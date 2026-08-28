import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { FunctionComponent } from "@/common/types";
import { useDocumentTitle } from "@/common/use-document-title";
import {
	Button,
	DataTable,
	DescriptionList,
	Heading,
	Notice,
	Text,
} from "@/components/ui";
import type { DataTableColumn } from "@/components/ui/DataTable";
import { getDepartment } from "@/fetch/departments";
import { getRequestErrorNotice } from "@/fetch";
import { ROLE_LABEL_KEYS } from "@/features/auth/authorization";
import { useWorkspaces } from "@/features/workspaces/hooks/use-workspaces";
import { useDevSession, useSession } from "@/hooks";

type AccountAccessRow = {
	[key: string]: unknown;
	role: string;
	workspaceName: string;
};

export const AccountPage = (): FunctionComponent => {
	const { i18n, t } = useTranslation();
	const navigate = useNavigate();
	const { currentUser, refreshSession } = useSession();
	const [clearError, setClearError] = useState(false);
	const { clearSession, currentFixture, isClearing } = useDevSession({
		enabled: Boolean(currentUser),
	});
	const partnerAccess = currentUser?.authorizationContext.partnerAccess ?? [];
	const shouldLoadWorkspaces =
		currentUser?.authorizationContext.globalRole === null &&
		partnerAccess.length > 0;
	const {
		error: workspacesError,
		isLoading,
		workspaces,
	} = useWorkspaces(shouldLoadWorkspaces);
	const departmentQuery = useQuery({
		enabled: Boolean(currentUser?.departmentUuid),
		queryFn: () =>
			currentUser?.departmentUuid
				? getDepartment(currentUser.departmentUuid)
				: null,
		queryKey: ["account-department", currentUser?.departmentUuid],
	});
	const title = t("account.title");
	useDocumentTitle(title, t("home.title"));
	const workspacesErrorNotice = getRequestErrorNotice(workspacesError, {
		bodyKey: "account.accessErrorBody",
		titleKey: "account.accessErrorTitle",
	});

	if (!currentUser) {
		return <Text>{t("account.loading")}</Text>;
	}

	const workspacesByUuid = new Map(
		workspaces.map((workspace) => [workspace.uuid, workspace.name])
	);
	const accessRows: Array<AccountAccessRow> = partnerAccess.map(
		(access, index) => ({
			role: t(ROLE_LABEL_KEYS[access.role] as never),
			workspaceName:
				workspacesByUuid.get(access.workspaceUuid) ??
				t("account.workspaceFallback", { number: index + 1 }),
		})
	);
	const accessColumns: Array<DataTableColumn<AccountAccessRow>> = [
		{
			field: "workspaceName",
			headerName: t("account.workspaceColumn"),
			rowHeader: true,
		},
		{ field: "role", headerName: t("account.roleColumn") },
	];
	const organization =
		(i18n.language.startsWith("fr")
			? departmentQuery.data?.nameFr || departmentQuery.data?.name
			: departmentQuery.data?.name) ??
		currentUser.departmentAbbreviation ??
		t("account.noOrganization");
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
		<>
			<Heading tag="h1">{title}</Heading>
			<Text>{t("account.summary")}</Text>
			<section className="grid gap-200">
				<Heading tag="h2">{t("account.identityTitle")}</Heading>
				<DescriptionList
					items={[
						{ label: t("account.nameLabel"), value: currentUser.name },
						{ label: t("account.emailLabel"), value: currentUser.email },
						{ label: t("account.organizationLabel"), value: organization },
					]}
				/>
			</section>

			<section className="mt-500 grid gap-200">
				<Heading tag="h2">{t("account.accessTitle")}</Heading>
				{currentUser.authorizationContext.globalRole ? (
					<DescriptionList
						items={[
							{
								label: t("account.globalRoleLabel"),
								value: t(
									ROLE_LABEL_KEYS[
										currentUser.authorizationContext.globalRole
									] as never
								),
							},
						]}
					/>
				) : isLoading ? (
					<Text>{t("account.accessLoading")}</Text>
				) : workspacesErrorNotice ? (
					<Notice
						noticeRole={workspacesErrorNotice.noticeRole}
						noticeTitle={t(workspacesErrorNotice.titleKey as never)}
						noticeTitleTag="h3"
					>
						<Text>
							{workspacesErrorNotice.bodyText ??
								t(workspacesErrorNotice.bodyKey as never)}
						</Text>
					</Notice>
				) : accessRows.length > 0 ? (
					<DataTable<AccountAccessRow>
						columns={accessColumns}
						itemLabel={t("account.workspaceAccessItemLabel")}
						rows={accessRows}
						title={t("account.workspaceAccessTitle")}
					/>
				) : (
					<Text>{t("account.noCanonicalAccess")}</Text>
				)}
			</section>

			{currentFixture ? (
				<section className="mt-500 grid gap-200">
					<Heading tag="h2">
						{t("localDevPersona.simulatedSessionLabel")}
					</Heading>
					<Text>
						{t("localDevPersona.simulatedIdentity", {
							email: currentFixture.email,
							name: currentFixture.name,
						})}
					</Text>
					<Button
						buttonRole="secondary"
						disabled={isClearing}
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
							noticeRole="danger"
							noticeTitle={t("localDevPersona.clearErrorTitle")}
							noticeTitleTag="h3"
						>
							<Text>{t("localDevPersona.clearErrorBody")}</Text>
						</Notice>
					) : null}
				</section>
			) : null}
		</>
	);
};
