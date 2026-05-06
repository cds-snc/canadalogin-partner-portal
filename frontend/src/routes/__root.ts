import { Outlet, createRootRoute } from "@tanstack/react-router";
import { createElement } from "react";
import { AppShell } from "../components/layout/AppShell";

const RootComponent = (): ReturnType<typeof createElement> =>
	createElement(AppShell, undefined, createElement(Outlet));

export const Route = createRootRoute({
	component: RootComponent,
});
