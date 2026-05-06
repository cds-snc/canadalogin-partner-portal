import { useNavigate } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import type { FunctionComponent } from "@/common/types";
import { Heading, Text } from "@/components/ui";
import { CenteredPageLayout } from "@/components/layout";
import { useSession } from "@/hooks";

export const LogoutPage = (): FunctionComponent => {
	const { t } = useTranslation();
	const { logout } = useSession();
	const navigate = useNavigate();
	const hasTriggeredLogout = useRef(false);

	useEffect(() => {
		if (hasTriggeredLogout.current) {
			return;
		}

		hasTriggeredLogout.current = true;

		void (async (): Promise<void> => {
			await logout();
			await navigate({ replace: true, to: "/" });
		})();
	}, [logout, navigate]);

	return (
		<CenteredPageLayout className="max-w-2xl">
			<Heading tag="h1">{t("logout.title")}</Heading>
			<Text>{t("logout.summary")}</Text>
		</CenteredPageLayout>
	);
};
