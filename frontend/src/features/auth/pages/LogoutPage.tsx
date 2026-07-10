import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import type { FunctionComponent } from "@/common/types";
import { Heading, Text } from "@/components/ui";
import { buildApiUrl } from "@/fetch/base-url";
import { useAuthStore } from "@/store";

export const LogoutPage = (): FunctionComponent => {
	const { t } = useTranslation();
	const reset = useAuthStore((state) => state.reset);

	useEffect(() => {
		reset();

		const timer = globalThis.setTimeout(() => {
			window.location.href = buildApiUrl("/api/v1/logout");
		}, 1000);

		return (): void => {
			globalThis.clearTimeout(timer);
		};
	}, [reset]);

	return (
		<>
			<Heading tag="h1">{t("logout.title")}</Heading>
			<Text>{t("logout.summary")}</Text>
		</>
	);
};
