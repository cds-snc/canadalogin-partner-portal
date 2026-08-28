/* eslint-disable camelcase -- Canonical API role codes intentionally use snake_case. */
import { useTranslation } from "react-i18next";
import type { FunctionComponent } from "@/common/types";
import { useDocumentTitle } from "@/common/use-document-title";
import { DataTable, Heading, Notice, Text } from "@/components/ui";
import type { DataTableColumn } from "@/components/ui/DataTable";
import {
	CANONICAL_ROLES,
	ROLE_LABEL_KEYS,
	type CanonicalRole,
} from "@/features/auth/authorization";

type RoleTableRow = {
	code: CanonicalRole;
	description: string;
	label: string;
	scope: string;
};

const ROLE_DESCRIPTION_KEYS: Readonly<Record<CanonicalRole, string>> = {
	cl_admin: "roles.descriptions.clAdmin",
	read_only: "roles.descriptions.readOnly",
	rp_admin: "roles.descriptions.rpAdmin",
	rp_user_edit: "roles.descriptions.rpUserEdit",
};

export const RolesPage = (): FunctionComponent => {
	const { t } = useTranslation();
	useDocumentTitle(t("roles.title"), t("home.title"));
	const rows: Array<RoleTableRow> = CANONICAL_ROLES.map((role) => ({
		code: role,
		description: t(ROLE_DESCRIPTION_KEYS[role] as never),
		label: t(ROLE_LABEL_KEYS[role] as never),
		scope: t(
			(role === "cl_admin"
				? "authorization.scopes.global"
				: "authorization.scopes.workspace") as never
		),
	}));
	const columns: Array<DataTableColumn<RoleTableRow>> = [
		{ field: "label", headerName: t("roles.nameLabel") },
		{ field: "code", headerName: t("roles.codeLabel") },
		{ field: "scope", headerName: t("roles.scopeLabel") },
		{ field: "description", headerName: t("roles.descriptionLabel") },
	];

	return (
		<div className="grid gap-300">
			<Heading tag="h1">{t("roles.title")}</Heading>
			<Text>{t("roles.summary")}</Text>
			<Notice
				noticeRole="info"
				noticeTitle={t("roles.immutableTitle")}
				noticeTitleTag="h2"
			>
				<Text>{t("roles.immutableBody")}</Text>
			</Notice>
			<DataTable
				columns={columns}
				itemLabel={t("roles.itemLabel")}
				pagination={false}
				rows={rows}
				title={t("roles.title")}
			/>
		</div>
	);
};
