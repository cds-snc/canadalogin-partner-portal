import { useTranslation } from "react-i18next";
import type { FunctionComponent } from "@/common/types";
import { Button, Card, Grid, Heading, Link, Notice, Text } from "@/components";
import { CenteredPageLayout } from "@/components/layout";
import { getBackendOrigin } from "@/fetch/auth";
import { useSession } from "@/hooks";

export const Home = (): FunctionComponent => {
	const { t } = useTranslation();
	const { currentUser, isAuthenticated, isLoading, login, logout } =
		useSession();
	const sessionSummaryTitle = isAuthenticated
		? t("home.signedInTitle")
		: t("home.signedOutTitle");
	const sessionSummaryBody =
		isAuthenticated && currentUser
			? t("home.signedInBody", { name: currentUser.name })
			: t("home.signedOutBody");
	const quickLinks = [
		{ href: "/dashboard", label: t("home.dashboardPageLink") },
		{ href: "/login", label: t("home.loginPageLink") },
		{ href: "/users", label: t("home.usersPageLink") },
		{ href: "/departments", label: t("home.departmentsPageLink") },
		{ href: "/policies", label: t("home.policiesPageLink") },
		{ href: "/roles", label: t("home.rolesPageLink") },
		{ href: "/tiers", label: t("home.tiersPageLink") },
		{ href: "/health", label: t("home.healthPageLink") },
		{ href: "/logout", label: t("home.logoutPageLink") },
	];
	const starterFeatures = [
		t("home.featureAccess"),
		t("home.featureContent"),
		t("home.featureObservability"),
	];

	const onLogoutClick = (): void => {
		void logout();
	};

	return (
		<CenteredPageLayout className="max-w-6xl gap-700 py-300">
			<section className="relative overflow-hidden border border-[var(--gcds-border-default)] bg-[linear-gradient(135deg,#f8fafc_0%,#eef4f8_52%,#ffffff_100%)] px-500 py-600 shadow-[0_22px_50px_rgba(38,55,74,0.08)] md:px-650 md:py-700">
				<div className="absolute top-0 right-0 h-40 w-40 bg-[radial-gradient(circle_at_top_right,rgba(38,55,74,0.09),transparent_68%)]" />
				<div className="relative grid gap-500 lg:grid-cols-[minmax(0,1.4fr)_minmax(18rem,0.92fr)] lg:items-start">
					<div className="flex flex-col gap-350">
						<p className="text-sm font-semibold tracking-[0.12em] text-[var(--gcds-text-secondary)] uppercase">
							{t("home.heroEyebrow")}
						</p>
						<div className="max-w-3xl">
							<Heading tag="h1">{t("home.title")}</Heading>
							<Heading marginBottom="200" marginTop="0" tag="h2">
								{t("home.heroTitle")}
							</Heading>
							<Text marginBottom="0">{t("home.summary")}</Text>
						</div>

						<div className="flex flex-wrap items-center gap-250 pt-100">
							{!isAuthenticated ? (
								<Button
									buttonId="oidc-login"
									buttonRole="primary"
									type="button"
									onGcdsClick={login}
								>
									{t("home.signInAction")}
								</Button>
							) : (
								<Button
									buttonId="logout"
									buttonRole="secondary"
									type="button"
									onGcdsClick={onLogoutClick}
								>
									{t("home.signOutAction")}
								</Button>
							)}
							<Link href="/profile">{t("home.profilePageLink")}</Link>
						</div>

						<div className="grid gap-200 border-t border-[rgba(38,55,74,0.12)] pt-350 sm:grid-cols-3">
							{starterFeatures.map((feature) => (
								<div
									key={feature}
									className="border border-[rgba(38,55,74,0.12)] bg-[rgba(255,255,255,0.72)] px-300 py-300"
								>
									<Text marginBottom="0" size="small">
										{feature}
									</Text>
								</div>
							))}
						</div>
					</div>

					<aside className="border border-[var(--gcds-border-default)] bg-[rgba(255,255,255,0.92)] px-400 py-450 shadow-[0_14px_32px_rgba(38,55,74,0.08)]">
						<p className="text-sm font-semibold tracking-[0.1em] text-[var(--gcds-text-secondary)] uppercase">
							{t("home.panelEyebrow")}
						</p>
						<Heading marginBottom="200" marginTop="0" tag="h2">
							{t("home.statusPanelTitle")}
						</Heading>
						<Text>{sessionSummaryTitle}</Text>
						<Text>{sessionSummaryBody}</Text>
						<Text size="small">
							{t("home.backendOrigin", { origin: getBackendOrigin() })}
						</Text>

						{isAuthenticated && currentUser ? (
							<div className="mt-250 flex flex-col gap-150 border-t border-[var(--gcds-border-default)] pt-250">
								<Text marginBottom="0" size="small">
									{t("home.signedInEmail", { email: currentUser.email })}
								</Text>
							</div>
						) : null}
					</aside>
				</div>
			</section>

			{isLoading ? (
				<Notice
					noticeRole="info"
					noticeTitle={t("home.loadingTitle")}
					noticeTitleTag="h2"
				>
					<Text>{t("home.loadingBody")}</Text>
				</Notice>
			) : null}

			<section className="grid gap-350 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
				<div className="border border-[var(--gcds-border-default)] bg-[var(--gcds-bg-white)] px-450 py-500 shadow-[0_14px_32px_rgba(38,55,74,0.06)]">
					<Heading marginTop="0" tag="h2">
						{t("home.featureSectionTitle")}
					</Heading>
					<ul className="grid gap-200">
						{starterFeatures.map((feature) => (
							<li
								key={feature}
								className="border-l-[3px] border-l-[var(--gcds-text-primary)] pl-250"
							>
								<Text marginBottom="0">{feature}</Text>
							</li>
						))}
					</ul>
				</div>

				<div className="border border-[var(--gcds-border-default)] bg-[var(--gcds-bg-white)] px-450 py-500 shadow-[0_14px_32px_rgba(38,55,74,0.06)]">
					<Heading marginTop="0" tag="h2">
						{t("home.supportingLinksTitle")}
					</Heading>
					<Text>{t("home.quickLinksBody")}</Text>
					<nav className="grid gap-x-300 gap-y-150 sm:grid-cols-2">
						{quickLinks.map((item) => (
							<Link key={item.href} href={item.href}>
								{item.label}
							</Link>
						))}
					</nav>
				</div>
			</section>

			<section className="flex flex-col gap-350">
				<div className="max-w-2xl">
					<Heading tag="h2">{t("home.referenceSectionTitle")}</Heading>
					<Text>{t("home.referenceSectionBody")}</Text>
				</div>
				<Grid
					columnsDesktop="1fr 1fr 1fr"
					columnsTablet="1fr 1fr"
					tag="section"
				>
					<Card
						badge="Sample"
						cardTitle={t("home.aboutCardTitle")}
						cardTitleTag="h3"
						description={t("home.aboutCardDescription")}
						href="/about"
					/>
					<Card
						badge="Sample"
						cardTitle={t("home.federalCardTitle")}
						cardTitleTag="h3"
						description={t("home.federalCardDescription")}
						href="/federal-and-provincial-holidays"
					/>
					<Card
						badge="Sample"
						cardTitle={t("home.optionalCardTitle")}
						cardTitleTag="h3"
						description={t("home.optionalCardDescription")}
						href="/optional-holidays"
					/>
				</Grid>
			</section>
		</CenteredPageLayout>
	);
};
