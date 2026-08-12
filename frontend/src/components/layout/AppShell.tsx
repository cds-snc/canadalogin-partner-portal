import type { PropsWithChildren } from "react";
import type { FunctionComponent } from "../../common/types";
import { InactivitySessionGuard } from "@/features/auth/components/InactivitySessionGuard";
import Container from "../ui/Container";
import DateModified from "../ui/DateModified";
import { LayoutFooter } from "./LayoutFooter";
import { LayoutHeader } from "./LayoutHeader";
import { AdministrationSectionLayout } from "@/features/administration/components/AdministrationSectionLayout";

type AppShellProps = PropsWithChildren;

export const AppShell = ({ children }: AppShellProps): FunctionComponent => {
	const lastUpdated = "2026-08-12";

	return (
		<>
			<InactivitySessionGuard />
			<LayoutHeader />
			<Container alignment="center" id="main-content" layout="page" tag="main">
				<AdministrationSectionLayout>{children}</AdministrationSectionLayout>
				<DateModified>{lastUpdated}</DateModified>
			</Container>
			<LayoutFooter />
		</>
	);
};
