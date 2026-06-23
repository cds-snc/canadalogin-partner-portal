import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import type { FunctionComponent } from "@/common/types";
import { Heading, Text } from "@/components/ui";
import { CenteredPageLayout } from "@/components/layout";
import { useAuthStore } from "@/store";

export const LogoutPage = (): FunctionComponent => {
	const { t } = useTranslation();
	const reset = useAuthStore((state) => state.reset);

	useEffect(() => {
		reset();

		const timer = globalThis.setTimeout(() => {
			window.location.href = "/api/v1/logout";
		}, 2000);

		return (): void => {
			globalThis.clearTimeout(timer);
		};
	}, [reset]);

	return (
		<CenteredPageLayout className="max-w-2xl">
			<Heading tag="h1">{t("logout.title")}</Heading>
			<Text>{t("logout.summary")}</Text>
		</CenteredPageLayout>
	);
};
