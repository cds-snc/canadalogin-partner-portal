import { useTranslation } from "react-i18next";
import type { FunctionComponent } from "@/common/types";
import {
	Button,
	Card,
	Container,
	Grid,
	Heading,
	Link,
	Notice,
	Text,
} from "@/components";
import { useSession } from "@/hooks";

export const Home = (): FunctionComponent => {
	const { t, i18n } = useTranslation();
	const { isLoading, login } = useSession();
	const lang = i18n.language?.startsWith("fr") ? "fr" : "en";

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
		<Grid columns="1fr" tag="div">
			<Container id="home-intro" tag="section">
				<Heading tag="h1">{t("home.title")}</Heading>
				<Text>{t("home.summary")}</Text>
				<Text>
					{t("home.summaryTermsPrefix")}
					<Link href="/terms-and-conditions">{t("home.summaryTermsLink")}</Link>
					{t("home.summaryTermsSuffix")}
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
			<Container id="home-about" tag="section">
				<Heading tag="h2">{t("home.aboutSectionTitle")}</Heading>
				<Text>{t("home.aboutSectionBody")}</Text>
			</Container>
			<Container id="home-cards" tag="section">
				<Grid columns="1fr" columnsTablet="1fr 1fr" tag="div">
					<Card
						cardTitle={t("home.supportCardTitle")}
						cardTitleTag="h3"
						description={t("home.supportCardDescription")}
						href="/support"
					/>
					<Card
						cardTitle={t("home.canadaLoginCardTitle")}
						cardTitleTag="h3"
						description={t("home.canadaLoginCardDescription")}
						href={`https://login.canada.ca/${lang}/`}
					/>
				</Grid>
			</Container>
		</Grid>
	);
};
