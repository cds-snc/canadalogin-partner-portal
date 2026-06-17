import type { PropsWithChildren } from "react";
import type { FunctionComponent } from "../../common/types";
import { InactivitySessionGuard } from "@/features/auth/components/InactivitySessionGuard";
import Container from "../ui/Container";
import DateModified from "../ui/DateModified";
import { LayoutFooter } from "./LayoutFooter";
import { LayoutHeader } from "./LayoutHeader";

type AppShellProps = PropsWithChildren;

export const AppShell = ({ children }: AppShellProps): FunctionComponent => {
	const lastUpdated = "2026-03-16";

	return (
		<>
			<InactivitySessionGuard />
			<LayoutHeader />
			<Container alignment="center" id="app-shell" layout="page" tag="main">
				{children}
				<DateModified>{lastUpdated}</DateModified>
			</Container>
			<LayoutFooter />
		</>
	);
};
