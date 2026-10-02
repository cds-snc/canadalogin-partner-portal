import type { PropsWithChildren, ReactElement } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AppShell } from "@/components/layout/AppShell";

let pathname = "/signed-out";

vi.mock("@tanstack/react-router", () => ({
	useRouterState: ({
		select,
	}: {
		select: (state: { location: { pathname: string } }) => unknown;
	}): unknown => select({ location: { pathname } }),
}));

vi.mock("@/features/auth/components/InactivitySessionGuard", () => ({
	InactivitySessionGuard: (): ReactElement => (
		<div data-testid="inactivity-session-guard" />
	),
}));

vi.mock("@/components/ui/Container", () => ({
	default: ({ children }: PropsWithChildren): ReactElement => <main>{children}</main>,
}));

vi.mock("@/components/ui/DateModified", () => ({
	default: (): ReactElement => <div data-testid="date-modified" />,
}));

vi.mock("@/components/layout/LayoutFooter", () => ({
	LayoutFooter: (): ReactElement => <footer />,
}));

vi.mock("@/components/layout/LayoutHeader", () => ({
	LayoutHeader: (): ReactElement => <header />,
}));

describe("AppShell", (): void => {
	it("does not mount inactivity tracking on the signed-out page", (): void => {
		pathname = "/signed-out";
		render(<AppShell>Signed out</AppShell>);

		expect(screen.queryByTestId("inactivity-session-guard")).toBeNull();
	});

	it("mounts inactivity tracking on authenticated application pages", (): void => {
		pathname = "/applications";
		render(<AppShell>Applications</AppShell>);

		expect(screen.getByTestId("inactivity-session-guard")).toBeTruthy();
	});
});