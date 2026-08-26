import { useTranslation } from "react-i18next";
import type { FunctionComponent } from "@/common/types";
import { Card, Container, Grid, Heading, Text } from "@/components";
import { useSession } from "@/hooks";
import {
	getTaskAreaRoutes,
	type RouteDefinition,
} from "@/features/navigation/route-catalog";

const ADMINISTRATION_ROUTE_DESCRIPTION_KEYS = {
	invitations: "administration.tasks.invitations",
	roleReference: "administration.tasks.roleReference",
	usersAndAccess: "administration.tasks.usersAndAccess",
} as const;

type AdministrationTaskRoute = RouteDefinition & {
	id: keyof typeof ADMINISTRATION_ROUTE_DESCRIPTION_KEYS;
};

const isAdministrationTaskRoute = (
	route: RouteDefinition
): route is AdministrationTaskRoute =>
	route.id in ADMINISTRATION_ROUTE_DESCRIPTION_KEYS;

const ADMINISTRATION_GROUPS = [
	{
		id: "accessManagement",
		routeIds: ["usersAndAccess", "invitations"],
		titleKey: "administration.groups.accessManagement",
	},
	{
		id: "monitoringAndReference",
		routeIds: ["roleReference"],
		titleKey: "administration.groups.monitoringAndReference",
	},
] as const;

export const AdministrationPage = (): FunctionComponent => {
	const { t } = useTranslation();
	const { currentUser } = useSession();
	const routes = getTaskAreaRoutes(
		"administration",
		currentUser?.authorizationContext
	).filter(isAdministrationTaskRoute);

	return (
		<Container id="administration-task-hub" tag="section">
			<Heading tag="h1">{t("administration.title")}</Heading>
			<Text>{t("administration.summary")}</Text>
			<div className="grid gap-500">
				{ADMINISTRATION_GROUPS.map((group) => {
					const groupRoutes = routes.filter((route) =>
						(group.routeIds as ReadonlyArray<string>).includes(route.id)
					);
					if (groupRoutes.length === 0) return null;

					return (
						<section key={group.id}>
							<Heading tag="h2">{t(group.titleKey)}</Heading>
							<Grid columns="1fr" columnsTablet="1fr 1fr" tag="div">
								{groupRoutes.map((route) => (
									<Card
										key={route.id}
										cardTitle={String(t(route.labelKey as never))}
										cardTitleTag="h3"
										href={route.path}
										description={String(
											t(
												ADMINISTRATION_ROUTE_DESCRIPTION_KEYS[route.id] as never
											)
										)}
									/>
								))}
							</Grid>
						</section>
					);
				})}
			</div>
		</Container>
	);
};
