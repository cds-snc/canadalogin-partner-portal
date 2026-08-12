import { useTranslation } from "react-i18next";
import { useSearch } from "@tanstack/react-router";
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
import { LocalPersonaSelector } from "@/features/auth/components/LocalPersonaSelector";
import {
	getRoutesForSurface,
	TASK_AREA_CATALOG,
	type RouteDefinition,
	type TaskAreaId,
} from "@/features/navigation/route-catalog";

const HOME_TASK_AREA_IDS = [
	"partnerWork",
	"reports",
	"onboardingOversight",
	"administration",
] as const satisfies ReadonlyArray<TaskAreaId>;

const HOME_TASK_AREA_DESCRIPTION_KEYS: Readonly<Record<TaskAreaId, string>> = {
	administration: "home.authenticated.administrationDescription",
	onboardingOversight: "home.authenticated.onboardingOversightDescription",
	partnerWork: "home.authenticated.partnerWorkDescription",
	reports: "home.authenticated.reportsDescription",
};

const HOME_ROUTE_DESCRIPTION_KEYS: Readonly<
	Record<
		Extract<
			RouteDefinition["id"],
			| "administration"
			| "onboardingOversight"
			| "reports"
			| "workspaces"
			| "yourApplications"
		>,
		string
	>
> = {
	administration: "home.authenticated.administrationLinkDescription",
	onboardingOversight: "home.authenticated.onboardingOversightLinkDescription",
	reports: "home.authenticated.reportsLinkDescription",
	workspaces: "home.authenticated.workspacesLinkDescription",
	yourApplications: "home.authenticated.yourApplicationsLinkDescription",
};

type HomeRoute = RouteDefinition & {
	id:
		| "administration"
		| "onboardingOversight"
		| "reports"
		| "workspaces"
		| "yourApplications";
};

const isHomeRoute = (route: RouteDefinition): route is HomeRoute =>
	route.id in HOME_ROUTE_DESCRIPTION_KEYS;

export const Home = (): FunctionComponent => {
	const { t, i18n } = useTranslation();
	const search = useSearch({ from: "/" });
	const { currentUser, isAuthenticated, isLoading, login } = useSession();
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

	if (isAuthenticated && currentUser) {
		const availableHomeRoutes = getRoutesForSurface(
			"home",
			currentUser.authorizationContext
		).filter(isHomeRoute);

		return (
			<Grid columns="1fr" tag="div">
				<Container id="authenticated-home-intro" tag="section">
					<Heading tag="h1">{t("home.title")}</Heading>
					<Text>{t("home.authenticated.summary")}</Text>
				</Container>
				{HOME_TASK_AREA_IDS.map((taskAreaId) => {
					const routes = availableHomeRoutes.filter(
						(route) => route.parentTaskArea === taskAreaId
					);
					if (routes.length === 0) {
						return null;
					}

					return (
						<Container
							key={taskAreaId}
							id={`home-task-area-${taskAreaId}`}
							tag="section"
						>
							<Heading tag="h2">
								{String(t(TASK_AREA_CATALOG[taskAreaId].labelKey as never))}
							</Heading>
							<Text>
								{String(
									t(HOME_TASK_AREA_DESCRIPTION_KEYS[taskAreaId] as never)
								)}
							</Text>
							<Grid columns="1fr" columnsTablet="1fr 1fr" tag="div">
								{routes.map((route) => (
									<Card
										key={route.id}
										cardTitle={String(t(route.labelKey as never))}
										cardTitleTag="h3"
										href={route.path}
										description={String(
											t(HOME_ROUTE_DESCRIPTION_KEYS[route.id] as never)
										)}
									/>
								))}
							</Grid>
						</Container>
					);
				})}
			</Grid>
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
					onGcdsClick={() => {
						login(search.redirect);
					}}
				>
					{t("home.signInAction")}
				</Button>
			</Container>
			<LocalPersonaSelector />
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
