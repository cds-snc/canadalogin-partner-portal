import type { PropsWithChildren, ReactElement } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ReportsPage } from "@/features/reports/pages/ReportsPage";

vi.mock("react-i18next", () => ({
	useTranslation: () => ({ t: (key: string): string => key }),
}));

vi.mock("@/components/ui", () => ({
	Card: ({
		cardTitle,
		href,
	}: {
		cardTitle: string;
		href: string;
	}): ReactElement => <a href={href}>{cardTitle}</a>,
	Grid: ({ children }: PropsWithChildren): ReactElement => (
		<div>{children}</div>
	),
	Heading: ({
		children,
		tag,
	}: PropsWithChildren<{ tag: "h1" | "h2" }>): ReactElement =>
		tag === "h1" ? <h1>{children}</h1> : <h2>{children}</h2>,
	Text: ({ children }: PropsWithChildren): ReactElement => <p>{children}</p>,
}));

describe("ReportsPage", () => {
	it("exposes only the scoped application MAU report family", () => {
		render(<ReportsPage />);

		expect(
			screen
				.getByRole("link", { name: "reports.cards.applications.title" })
				.getAttribute("href")
		).toBe("/reports/applications");
		expect(
			screen.queryByRole("link", { name: "reports.cards.onboarding.title" })
		).toBeNull();
		expect(
			screen.queryByRole("link", { name: "reports.cards.workspaces.title" })
		).toBeNull();
	});
});
