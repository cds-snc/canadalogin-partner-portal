import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";
import i18n from "@/common/i18n";
import type { RouteBreadcrumbContext } from "@/types/route-breadcrumbs";
import { requireSuperuser } from "../features/auth/auth-routing";

const UsersPage = lazy(async () => ({
	default: (await import("../features/users/pages/UsersPage")).UsersPage,
}));

export const Route = createFileRoute("/users")({
	beforeLoad: async () => {
		await requireSuperuser("/users");

		return {
			breadcrumbs: [
				{ href: "/", label: i18n.t("nav.home") },
				{ href: "/users", label: i18n.t("nav.users") },
			],
		} satisfies RouteBreadcrumbContext;
	},
	component: UsersPage,
});
