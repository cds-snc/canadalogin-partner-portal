import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";
import { resolveLegacyRPConfigurationPath } from "@/features/rp-applications/legacy-rp-configuration-route";
import { requirePartnerAccess } from "../../features/auth/auth-routing";

export const Route = createFileRoute("/your-applications/$rpApplicationUuid")({
	beforeLoad: async ({ params, location }) => {
		const legacyBase = `/your-applications/${params.rpApplicationUuid}`;
		await requirePartnerAccess(legacyBase);
		const href = await resolveLegacyRPConfigurationPath({
			legacySuffix: location.pathname
				.slice(legacyBase.length)
				.replace(/\/$/, ""),
			rpConfigurationUuid: params.rpApplicationUuid,
		});
		throw redirect({
			href: href ?? "/error?kind=not_found",
			replace: true,
		}) as unknown as Error;
	},
	component: Outlet,
});
