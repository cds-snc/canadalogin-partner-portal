import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";

const UserAccessPage = lazy(async () => ({
	default: (await import("../../../features/users/pages/UserAccessPage"))
		.UserAccessPage,
}));

export const Route = createFileRoute("/users/$userUuid/")({
	component: UserAccessPage,
});
