import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";
import { requireAuthenticatedUser } from "../features/auth/auth-routing";

const PostManagementPage = lazy(async () => ({ default: (await import("../features/posts/pages/PostManagementPage")).PostManagementPage }));

export const Route = createFileRoute("/posts")({
	beforeLoad: async () => requireAuthenticatedUser("/posts"),
	component: PostManagementPage,
});