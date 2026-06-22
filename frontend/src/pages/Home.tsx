import { useTranslation } from "react-i18next";
import type { FunctionComponent } from "@/common/types";
import { Button, Card, Grid, Heading, Notice, Text } from "@/components";
import { CenteredPageLayout } from "@/components/layout";
import { useSession } from "@/hooks";

export const Home = (): FunctionComponent => {
	const { t } = useTranslation();
	const { isAuthenticated, isLoading, login, logout } = useSession();

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

	const onLogoutClick = (): void => {
		void logout();
	};

	return (
		<>
			<section className="border border-[var(--gcds-border-default)] bg-[var(--gcds-bg-light)] px-500 py-600 md:px-650 md:py-700">
				<div className="max-w-3xl">
					<span className="text-sm font-semibold tracking-[0.12em] text-[var(--gcds-text-secondary)] uppercase">
						{t("home.heroEyebrow")}
					</span>
					<Heading tag="h1">{t("home.title")}</Heading>
					<Heading marginBottom="200" marginTop="0" tag="h2">
						{t("home.heroTitle")}
					</Heading>
					<Text marginBottom="0">{t("home.summary")}</Text>

					<div className="flex flex-wrap items-center gap-250 pt-100">
						{!isAuthenticated ? (
							<Button
								buttonId="oidc-login"
								buttonRole="start"
								type="button"
								onGcdsClick={login}
							>
								{t("home.signInAction")}
							</Button>
						) : (
							<>
								<Button
									buttonId="goto-dashboard"
									buttonRole="primary"
									href="/dashboard"
									type="link"
								>
									{t("home.dashboardPageLink")}
								</Button>
								<Button
									buttonId="logout"
									buttonRole="secondary"
									type="button"
									onGcdsClick={onLogoutClick}
								>
									{t("home.signOutAction")}
								</Button>
							</>
						)}
					</div>
				</div>
			</section>

			<section>
				<div className="mt-400">
					<Grid columnsDesktop="1fr 1fr 1fr" columnsTablet="1fr 1fr" tag="div">
						<Card
							cardTitle={t("home.aboutCardTitle")}
							cardTitleTag="h3"
							description={t("home.aboutCardDescription")}
							href="/about"
						/>
						<Card
							cardTitle={t("home.optionalCardTitle")}
							cardTitleTag="h3"
							description={t("home.optionalCardDescription")}
							href="/terms-and-conditions"
						/>
						<Card
							cardTitle={t("home.supportCardTitle")}
							cardTitleTag="h3"
							description={t("home.supportCardDescription")}
							href="/support"
						/>
					</Grid>
				</div>
			</section>
		</>
	);
};
