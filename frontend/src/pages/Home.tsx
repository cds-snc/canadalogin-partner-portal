import { useTranslation } from "react-i18next";
import type { FunctionComponent } from "@/common/types";
import {
	Button,
	Container,
	Heading,
	Link,
	Notice,
	Text,
} from "@/components";
import { useSession } from "@/hooks";

export const Home = (): FunctionComponent => {
	const { t } = useTranslation();
	const { isLoading, login } = useSession();

	if (isLoading) {
		return (
			<>
				<Notice
					noticeRole="info"
					noticeTitle={t("home.loadingTitle")}
					noticeTitleTag="h2"
				>
					<Text>{t("home.loadingBody")}</Text>
				</Notice>
			</>
		);
	}

	return (
		<Container id="home-intro" tag="section">
			<Heading tag="h1">{t("home.title")}</Heading>
			<Text>{t("home.summary")}</Text>
			<Text>{t("home.eligibility")}</Text>
			<Text>
				{t("home.accessRequestPrefix")}
				<Link href="/support">{t("home.accessRequestLink")}</Link>
				{t("home.accessRequestSuffix")}
			</Text>
			<Button
				buttonId="oidc-login"
				buttonRole="start"
				type="button"
				onGcdsClick={login}
			>
				{t("home.signInAction")}
			</Button>
		</Container>
	);
};
