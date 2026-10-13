import type { ReactElement, ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ConfigurationGrid from "@/components/ui/ConfigurationGrid";

vi.mock("@gcds-core/components-react", () => ({
	GcdsGrid: ({
		children,
		className,
		columns,
		columnsTablet,
		tag: Tag = "div",
	}: {
		children: ReactNode;
		className?: string;
		columns?: string;
		columnsTablet?: string;
		tag?: "div";
	}): ReactElement => (
		<Tag
			className={className}
			data-columns={columns}
			data-columns-tablet={columnsTablet}
		>
			{children}
		</Tag>
	),
	GcdsText: ({ children }: { children: ReactNode }): ReactElement => (
		<span>{children}</span>
	),
}));

describe("ConfigurationGrid", () => {
	it("renders three columns with React content and an optional edit cell", () => {
		render(
			<ConfigurationGrid
				ariaLabel="Environment configuration"
				fieldColumnWidth="16rem"
				rows={[
					{
						field: "Environment name",
						value: <strong>TEST-portal</strong>,
						edit: <a href="#">Change</a>,
					},
					{ field: "Created", value: "January 1, 2026" },
				]}
			/>
		);

		const grid = screen.getByRole("region", {
			name: "Environment configuration",
		});
		const rows = grid.querySelectorAll(".configuration-grid__row");

		expect(rows).toHaveLength(2);
		expect(grid.getAttribute("style")).toContain(
			"--configuration-grid-field-column-width: 16rem"
		);
		expect(rows[0]?.getAttribute("data-columns")).toBe("1fr");
	expect(rows[0]?.getAttribute("data-columns-tablet")).toContain(
			"var(--configuration-grid-field-column-width"
		);
		expect(rows[0]?.children).toHaveLength(3);
		expect(screen.getByText("TEST-portal")).toBeTruthy();
		expect(screen.getByRole("link", { name: "Change" })).toBeTruthy();
		expect(screen.queryByText("Actions")).toBeNull();
		expect(
			grid.querySelector(".configuration-grid__field")
		).toBeTruthy();
	});
});