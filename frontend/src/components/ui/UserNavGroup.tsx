import type { RefObject } from "react";
import { useTranslation } from "react-i18next";
import { GcdsNavGroup, GcdsNavLink } from "@gcds-core/components-react";
import type { FunctionComponent } from "@/common/types";
import { useSession } from "@/hooks";

type UserNavGroupProps = {
	contextLabel: string | null;
	navGroupRef: RefObject<HTMLGcdsNavGroupElement | null>;
	onRequestClose: (returnFocus: boolean) => void;
};

export const UserNavGroup = ({
	contextLabel,
	navGroupRef,
	onRequestClose,
}: UserNavGroupProps): FunctionComponent => {
	const { t } = useTranslation() as unknown as {
		t: (key: string, options?: Record<string, unknown>) => string;
	};
	const { currentUser } = useSession();

	if (!currentUser) {
		return null;
	}

	const triggerLabel = contextLabel
		? t("nav.accountMenuTrigger", {
				context: contextLabel,
				name: currentUser.name,
			})
		: currentUser.name;
	return (
		<GcdsNavGroup
			ref={navGroupRef}
			menuLabel={triggerLabel}
			openTrigger={triggerLabel}
		>
			<GcdsNavLink
				href="/account"
				onGcdsClick={() => {
					onRequestClose(false);
				}}
			>
				{t("nav.account")}
			</GcdsNavLink>
			<GcdsNavLink
				href="/logout"
				onGcdsClick={() => {
					onRequestClose(false);
				}}
			>
				{t("nav.logout")}
			</GcdsNavLink>
		</GcdsNavGroup>
	);
};
