import type { PropsWithChildren, ReactElement } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ReportsPage } from "@/features/reports/pages/ReportsPage";
import { useSession } from "@/hooks";

vi.mock("react-i18next", () => ({
	useTranslation: () => ({ t: (key: string): string => key }),
}));

vi.mock("@/hooks", () => ({ useSession: vi.fn() }));

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
	it("shows platform and workspace reporting to a CL Admin", () => {
		vi.mocked(useSession).mockReturnValue({
			currentUser: {
				authorizationContext: { globalRole: "cl_admin", partnerAccess: [] },
			},
		} as never);

		render(<ReportsPage />);

		expect(
			screen
				.getByRole("link", { name: "reports.cards.onboarding.title" })
				.getAttribute("href")
		).toBe("/onboarding-oversight/reports");
		expect(
			screen
				.getByRole("link", { name: "reports.cards.workspaces.title" })
				.getAttribute("href")
		).toBe("/reports/workspaces");
		expect(
			screen.queryByRole("link", {
				name: "reports.cards.applications.title",
			})
		).toBeNull();
	});

	it.each(["rp_admin", "rp_user_edit", "read_only"] as const)(
		"shows only partner report families allowed by the %s role",
		(role) => {
			vi.mocked(useSession).mockReturnValue({
				currentUser: {
					authorizationContext: {
						globalRole: null,
						partnerAccess: [{ role, workspaceUuid: "workspace-uuid-1" }],
					},
				},
			} as never);

			render(<ReportsPage />);

			expect(
				screen.queryByRole("link", { name: "reports.cards.onboarding.title" })
			).toBeNull();
			expect(
				screen.getByRole("link", { name: "reports.cards.workspaces.title" })
			).toBeTruthy();
			expect(
				screen.getByRole("link", { name: "reports.cards.applications.title" })
			).toBeTruthy();
		}
	);
});
