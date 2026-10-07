import {
	Outlet,
	createRootRoute,
	type ErrorComponentProps,
} from "@tanstack/react-router";
import { createElement, useEffect } from "react";
import { AppShell } from "../components/layout/AppShell";

const RootComponent = (): ReturnType<typeof createElement> =>
	createElement(AppShell, undefined, createElement(Outlet));

const RootErrorComponent = ({ error }: ErrorComponentProps): null => {
	useEffect(() => {
		if (globalThis.location.pathname !== "/error") {
			globalThis.location.replace("/error?kind=unexpected");
		}
	}, [error]);

	return null;
};

export const Route = createRootRoute({
	component: RootComponent,
	errorComponent: RootErrorComponent,
});
