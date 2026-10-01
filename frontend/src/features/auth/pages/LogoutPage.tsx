import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import type { FunctionComponent } from "@/common/types";
import { Heading, Text } from "@/components/ui";
import { buildApiUrl } from "@/fetch/base-url";
import { useAuthStore } from "@/store";

type LogoutReason = "session-expired";

type LogoutPageProps = {
	reason?: LogoutReason;
};

export const LogoutPage = ({ reason }: LogoutPageProps): FunctionComponent => {
	const { t } = useTranslation();
	const reset = useAuthStore((state) => state.reset);
	const logoutReason = reason ?? "manual";

	useEffect(() => {
		reset();

		const timer = globalThis.setTimeout(() => {
			window.location.href = buildApiUrl(
				`/api/v1/logout?reason=${logoutReason}`
			);
		}, 1000);

		return (): void => {
			globalThis.clearTimeout(timer);
		};
	}, [logoutReason, reset]);

	return (
		<>
			<Heading tag="h1">{t("logout.title")}</Heading>
			<Text>{t("logout.summary")}</Text>
		</>
	);
};
