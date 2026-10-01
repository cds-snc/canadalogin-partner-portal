import { useTranslation } from "react-i18next";
import type { FunctionComponent } from "@/common/types";
import { Button, Heading, Text } from "@/components/ui";
import { useAuthStore } from "@/store";

type SignedOutReason = "session-expired";

type SignedOutPageProps = {
	reason?: SignedOutReason;
};

export const SignedOutPage = ({ reason }: SignedOutPageProps): FunctionComponent => {
	const { t } = useTranslation();
	const login = useAuthStore((state) => state.login);
	const summary =
		reason === "session-expired"
			? t("signedOut.expiredSummary")
			: t("signedOut.summary");

	return (
		<>
			<Heading tag="h1">{t("signedOut.title")}</Heading>
			<Text>{summary}</Text>
			<Text>{t("signedOut.securityReminder")}</Text>
			<Button buttonRole="primary" type="button" onGcdsClick={login}>
				{t("signedOut.action")}
			</Button>
		</>
	);
};