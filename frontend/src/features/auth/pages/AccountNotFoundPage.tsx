import { useTranslation } from "react-i18next";
import type { FunctionComponent } from "@/common/types";
import { Button, Container, Heading, Link, Text } from "@/components/ui";
import { logoutAndRedirect } from "@/fetch/auth";
import { useAuthStore } from "@/store";

export const AccountNotFoundPage = (): FunctionComponent => {
	const { t } = useTranslation();
	const reset = useAuthStore((state) => state.reset);

	const onSignOutClick = (): void => {
		reset();
		void logoutAndRedirect("manual");
	};

	return (
		<Container alignment="start" id="account-not-found-content" size="md">
			<Heading tag="h1">{t("accountNotFound.title")}</Heading>
			<Text>{t("accountNotFound.summary")}</Text>
			<Text marginBottom="0">{t("accountNotFound.reasonIntro")}</Text>
			<ul className="list-disc mt-0 mb-300 pl-400">
				<li>{t("accountNotFound.reasonDifferentEmail")}</li>
				<li>{t("accountNotFound.reasonAccessNotSetUp")}</li>
			</ul>
			<Heading tag="h2">{t("accountNotFound.existingAccessTitle")}</Heading>
			<Text>{t("accountNotFound.existingAccessBody")}</Text>
			<Button buttonRole="primary" type="button" onGcdsClick={onSignOutClick}>
				{t("accountNotFound.signOutAction")}
			</Button>
			<Heading tag="h2">{t("accountNotFound.noAccessTitle")}</Heading>
			<Link href="/support">{t("accountNotFound.requestAccess")}</Link>
		</Container>
	);
};