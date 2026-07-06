import { useTranslation } from "react-i18next";
import type { FunctionComponent } from "@/common/types";
import { Button, Card, Grid, Heading, Link, Notice, Text } from "@/components";
import { CenteredPageLayout } from "@/components/layout";
import { useSession } from "@/hooks";

export const Home = (): FunctionComponent => {
	const { t, i18n } = useTranslation();
	const { isLoading, login } = useSession();
	const lang = i18n.language?.startsWith("fr") ? "fr" : "en";

	if (isLoading) {
		return (
			<CenteredPageLayout className="max-w-3xl">
				<Notice
					noticeRole="info"
					noticeTitle={t("home.loadingTitle")}
					noticeTitleTag="h2"
				>
					<Text>{t("home.loadingBody")}</Text>
				</Notice>
			</CenteredPageLayout>
		);
	}

	return (
		<>
			<section>
				<Heading tag="h1">{t("home.title")}</Heading>
				<Text>{t("home.summary")}</Text>
				<Text>
					{t("home.summaryTermsPrefix")}
					<Link href="/terms-and-conditions">{t("home.summaryTermsLink")}</Link>
					{t("home.summaryTermsSuffix")}
				</Text>

				<div className="flex flex-wrap items-center gap-250 pt-100">
					<Button
						buttonId="oidc-login"
						buttonRole="start"
						type="button"
						onGcdsClick={login}
					>
						{t("home.signInAction")}
					</Button>
				</div>

				<div className="mt-400">
					<Heading tag="h2">{t("home.aboutSectionTitle")}</Heading>
					<Text>{t("home.aboutSectionBody")}</Text>
				</div>
			</section>

			<section>
				<div className="mt-400">
					<Grid columnsDesktop="1fr 1fr" columnsTablet="1fr 1fr" tag="div">
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
				</div>
			</section>
		</>
	);
};
