import { Outlet, createFileRoute } from "@tanstack/react-router";
import i18n from "../../../../common/i18n";
import {
	getApplicationEnvironment,
	type ApplicationEnvironmentRead,
} from "../../../../fetch/application-environments";
import { appQueryClient } from "../../../../lib/query-client";
import type { RouteBackLinkContext } from "../../../../types/route-breadcrumbs";

const environmentQueryKey = (
	applicationUuid: string,
	environmentUuid: string
): Array<string> => [
	"application-environment",
	applicationUuid,
	environmentUuid,
];

const getEnvironmentName = (
	environment: ApplicationEnvironmentRead | undefined
): string | null =>
	environment?.config?.environmentName ?? environment?.partnerLabel ?? null;

export const Route = createFileRoute(
	"/applications/$applicationUuid/environments/$environmentUuid"
)({
		beforeLoad: async ({ params }) => {
		const environment = await appQueryClient
			.ensureQueryData({
					queryKey: environmentQueryKey(
						params.applicationUuid,
						params.environmentUuid
					),
					queryFn: () =>
						getApplicationEnvironment(
							params.applicationUuid,
							params.environmentUuid
						),
						})
						.catch(() => undefined);
			const environmentName = getEnvironmentName(environment);

			return {
				backLink: {
				href: `/applications/${params.applicationUuid}/environments`,
				label: i18n.t("applicationEnvironments.title"),
				showBackLabel: false,
			},
				breadcrumbs: [
					{
						href: "/applications",
						label: i18n.t("nav.applications"),
						showBackLabel: false,
					},
					{
						href: `/applications/${params.applicationUuid}/environments`,
						label: i18n.t("applicationEnvironments.title"),
						showBackLabel: false,
					},
					...(environmentName
						? [
								{
									href: `/applications/${params.applicationUuid}/environments/${params.environmentUuid}`,
									label: environmentName,
									showBackLabel: false,
								},
							]
						: []),
				],
			} satisfies RouteBackLinkContext;
		},
	component: Outlet,
});