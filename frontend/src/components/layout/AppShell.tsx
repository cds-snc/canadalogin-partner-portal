import type { PropsWithChildren } from "react";
import { useRouterState } from "@tanstack/react-router";
import type { FunctionComponent } from "../../common/types";
import { InactivitySessionGuard } from "@/features/auth/components/InactivitySessionGuard";
import Container from "../ui/Container";
import DateModified from "../ui/DateModified";
import { LayoutFooter } from "./LayoutFooter";
import { LayoutHeader } from "./LayoutHeader";
import { AdministrationSectionLayout } from "@/features/administration/components/AdministrationSectionLayout";
import { getPageLastUpdated } from "./page-last-updated";

type AppShellProps = PropsWithChildren;

export const AppShell = ({ children }: AppShellProps): FunctionComponent => {
	const pathname = useRouterState({
		select: (state) => state.location.pathname,
	});
	const lastUpdated = getPageLastUpdated(pathname);

	return (
		<>
			<InactivitySessionGuard />
			<LayoutHeader />
			<Container
				alignment="center"
				className="mb-600"
				id="main-content"
				layout="page"
				tag="main"
			>
				<AdministrationSectionLayout>{children}</AdministrationSectionLayout>
				{lastUpdated ? <DateModified>{lastUpdated}</DateModified> : null}
			</Container>
			<LayoutFooter />
		</>
	);
};
