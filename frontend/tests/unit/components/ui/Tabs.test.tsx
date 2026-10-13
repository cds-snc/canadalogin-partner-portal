import type { PropsWithChildren, ReactElement } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Tabs from "@/components/ui/Tabs";

vi.mock("@gcds-core/components-react", () => ({
	GcdsGrid: ({
		children,
		...properties
	}: PropsWithChildren<Record<string, unknown>>): ReactElement => (
		<div {...properties}>{children}</div>
	),
	GcdsLink: ({
		children,
		...properties
	}: PropsWithChildren<Record<string, unknown>>): ReactElement => (
		<a {...properties}>{children}</a>
	),
}));

describe("Tabs", () => {
	it("renders route links with the active page state", () => {
		render(
			<Tabs
				ariaLabel="Environment views"
				items={[
					{ active: true, href: "/configuration", label: "Configuration" },
					{ href: "/credentials", label: "Credentials" },
				]}
			/>
		);

		expect(screen.getByRole("navigation", { name: "Environment views" })).toBeTruthy();
		expect(
			screen.getByRole("link", { name: "Configuration" }).getAttribute(
				"aria-current"
			)
		).toBe("page");
		expect(
			screen.getByRole("link", { name: "Credentials" }).getAttribute(
				"aria-current"
			)
		).toBeNull();
	});
});