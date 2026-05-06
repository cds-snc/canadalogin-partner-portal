import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";
import { requireSuperuser } from "../features/auth/auth-routing";

const DepartmentsPage = lazy(async () => ({
	default: (await import("../features/departments/pages/DepartmentsPage"))
		.DepartmentsPage,
}));

export const Route = createFileRoute("/departments")({
	beforeLoad: async () => requireSuperuser("/departments"),
	component: DepartmentsPage,
});
