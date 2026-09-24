import { useTranslation } from "react-i18next";
import { GcdsNavGroup, GcdsNavLink } from "@gcds-core/components-react";
import type { FunctionComponent } from "@/common/types";
import { useSession } from "@/hooks";

export const UserNavGroup = (): FunctionComponent => {
	const { t } = useTranslation();
	const { currentUser } = useSession();

	if (!currentUser) {
		return null;
	}

	return (
		<GcdsNavGroup
			menuLabel={t("nav.account")}
			openTrigger={t("nav.account")}
		>
			<GcdsNavLink href="/profile/setup">
				{t("nav.manageProfile")}
			</GcdsNavLink>
			<GcdsNavLink href="/logout">{t("nav.logout")}</GcdsNavLink>
		</GcdsNavGroup>
	);
};
