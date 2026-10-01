import type { PropsWithChildren } from "react";
import { useRouterState } from "@tanstack/react-router";
import type { FunctionComponent } from "../../common/types";
import { InactivitySessionGuard } from "@/features/auth/components/InactivitySessionGuard";
import Container from "../ui/Container";
import DateModified from "../ui/DateModified";
import { LayoutFooter } from "./LayoutFooter";
import { LayoutHeader } from "./LayoutHeader";

type AppShellProps = PropsWithChildren;

export const AppShell = ({ children }: AppShellProps): FunctionComponent => {
	const lastUpdated = "2026-03-16";
	const pathname = useRouterState({
		select: (state) => state.location.pathname,
	});
	const showInactivitySessionGuard = pathname !== "/signed-out";

	return (
		<>
			{showInactivitySessionGuard && <InactivitySessionGuard />}
			<LayoutHeader />
			<Container alignment="center" id="app-shell" layout="page" tag="main">
				{children}
				<DateModified>{lastUpdated}</DateModified>
			</Container>
			<LayoutFooter />
		</>
	);
};
