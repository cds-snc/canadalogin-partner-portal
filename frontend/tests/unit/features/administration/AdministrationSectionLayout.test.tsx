import type { PropsWithChildren, ReactElement } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AdministrationSectionLayout } from "@/features/administration/components/AdministrationSectionLayout";

const routerState = vi.hoisted(() => ({ pathname: "/users" }));

vi.mock("react-i18next", () => ({
	useTranslation: () => ({
		t: (key: string): string =>
			key === "administration.backToHub" ? "Back to Administration" : key,
	}),
}));

vi.mock("@tanstack/react-router", () => ({
	useRouterState: ({
		select,
	}: {
		select: (state: { location: { pathname: string } }) => string;
	}): string => select({ location: { pathname: routerState.pathname } }),
}));

vi.mock("@/components", () => ({
	Link: ({
		children,
		href,
	}: PropsWithChildren<{ href: string }>): ReactElement => (
		<a href={href}>{children}</a>
	),
}));

describe("AdministrationSectionLayout", () => {
	it("uses full content width and provides a deterministic parent link on a first-level child", () => {
		render(
			<AdministrationSectionLayout>
				<p>Users page content</p>
			</AdministrationSectionLayout>
		);

		expect(screen.queryByRole("navigation")).toBeNull();
		expect(screen.getByText("Users page content")).toBeTruthy();
		expect(
			screen
				.getByRole("link", { name: "Back to Administration" })
				.getAttribute("href")
		).toBe("/administration");
	});

	it("does not add a redundant parent link on the Administration hub", () => {
		routerState.pathname = "/administration";
		render(
			<AdministrationSectionLayout>Hub content</AdministrationSectionLayout>
		);

		expect(screen.queryByRole("link")).toBeNull();
		expect(screen.getByText("Hub content")).toBeTruthy();
	});
});
