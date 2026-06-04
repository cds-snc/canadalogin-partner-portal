import type { PropsWithChildren } from "react";
import type { FunctionComponent } from "../../common/types";
import { InactivitySessionGuard } from "@/features/auth/components/InactivitySessionGuard";
import Container from "../ui/Container";
import DateModified from "../ui/DateModified";
import { LayoutFooter } from "./LayoutFooter";
import { LayoutHeader } from "./LayoutHeader";
import { PageContent } from "./PageContent";

type AppShellProps = PropsWithChildren;

export const AppShell = ({ children }: AppShellProps): FunctionComponent => {
	const lastUpdated = "2026-03-16";

	return (
		<>
			<InactivitySessionGuard />
			<LayoutHeader />
			<main className="bg-[var(--gcds-bg-white)]" id="main-content">
				<Container alignment="center" id="app-shell" size="xl" tag="div">
					<PageContent>{children}</PageContent>
					<div className="border-t border-[var(--gcds-border-default)] pt-500">
						<DateModified>{lastUpdated}</DateModified>
					</div>
				</Container>
			</main>
			<LayoutFooter />
		</>
	);
};
