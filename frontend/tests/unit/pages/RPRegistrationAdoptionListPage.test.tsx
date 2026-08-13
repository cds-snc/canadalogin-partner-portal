import type { PropsWithChildren, ReactElement } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useRPRegistrationAdoptionCandidates } from "@/features/workspaces/hooks/use-rp-registration-adoption";
import { RPRegistrationAdoptionListPage } from "@/features/workspaces/pages/RPRegistrationAdoptionListPage";

const navigateMock = vi.fn();

vi.mock("react-i18next", () => ({
	useTranslation: () => ({
		t: (key: string): string =>
			({
				"home.title": "Partner portal",
				"common.notProvided": "Not provided",
				"rpRegistrationAdoption.backToWorkspaces": "Return to Workspaces",
				"rpRegistrationAdoption.completeness.incomplete": "Missing portal data",
				"rpRegistrationAdoption.emptyBody": "No eligible registration.",
				"rpRegistrationAdoption.emptyTitle": "No registrations to link",
				"rpRegistrationAdoption.ibmApplicationIdColumn": "IBM application ID",
				"rpRegistrationAdoption.loadingBody": "Loading candidates.",
				"rpRegistrationAdoption.loadingTitle": "Loading registrations",
				"rpRegistrationAdoption.nameColumn": "Registration",
				"rpRegistrationAdoption.partnerEnvironmentColumn":
					"Partner environment",
				"rpRegistrationAdoption.reviewAction": "Review and link",
				"rpRegistrationAdoption.summary": "Link retained registrations.",
				"rpRegistrationAdoption.tableTitle": "Unassigned registrations",
				"rpRegistrationAdoption.title": "Adopt existing RP registrations",
			})[key] ?? key,
	}),
}));

vi.mock("@tanstack/react-router", () => ({
	useNavigate: () => navigateMock,
}));

vi.mock("@/components/ui", () => ({
	Button: ({ children, href }: PropsWithChildren<{ href?: string }>) => (
		<a href={href}>{children}</a>
	),
	DataTable: ({ action, columns, rows, title }: any): ReactElement => (
		<section>
			<h2>{title}</h2>
			{columns.map((column: any) => (
				<span key={column.field}>{column.headerName}</span>
			))}
			{rows.map((row: any) => (
				<div key={row.rpApplicationUuid}>
					{row.configurationName} {row.partnerEnvironment}
				</div>
			))}
			{rows[0] ? (
				<button type="button" onClick={() => action.onAction(rows[0])}>
					{action.buttonLabel}
				</button>
			) : null}
		</section>
	),
	Heading: ({ children }: PropsWithChildren): ReactElement => (
		<h1>{children}</h1>
	),
	Notice: ({ children, noticeTitle }: any): ReactElement => (
		<section>
			<h2>{noticeTitle}</h2>
			{children}
		</section>
	),
	Text: ({ children }: PropsWithChildren): ReactElement => <p>{children}</p>,
}));

vi.mock("@/features/workspaces/hooks/use-rp-registration-adoption", () => ({
	useRPRegistrationAdoptionCandidates: vi.fn(),
}));

describe("RPRegistrationAdoptionListPage", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("shows loading and empty states", () => {
		vi.mocked(useRPRegistrationAdoptionCandidates)
			.mockReturnValueOnce({
				candidates: [],
				error: null,
				isLoading: true,
				refetch: vi.fn(),
			})
			.mockReturnValueOnce({
				candidates: [],
				error: null,
				isLoading: false,
				refetch: vi.fn(),
			});

		const { rerender } = render(<RPRegistrationAdoptionListPage />);
		expect(
			screen.getByRole("heading", { name: "Loading registrations" })
		).toBeTruthy();

		rerender(<RPRegistrationAdoptionListPage />);
		expect(
			screen.getByRole("heading", { name: "No registrations to link" })
		).toBeTruthy();
		expect(
			screen.getByRole("link", { name: "Return to Workspaces" })
		).toBeTruthy();
	});

	it("opens the focused route for a selected retained registration", () => {
		vi.mocked(useRPRegistrationAdoptionCandidates).mockReturnValue({
			candidates: [
				{
					configurationName: "Benefits production",
					ibmApplicationId: "ibm-app-1",
					metadataCompleteness: "incomplete",
					missingFieldNames: ["redirectUris"],
					name: "Benefits Portal",
					partnerEnvironment: null,
					rpApplicationUuid: "rp-application-1",
					updatedAt: null,
				},
			],
			error: null,
			isLoading: false,
			refetch: vi.fn(),
		});

		render(<RPRegistrationAdoptionListPage />);
		expect(screen.getByText(/Benefits production Not provided/)).toBeTruthy();
		expect(screen.getByText("Partner environment")).toBeTruthy();
		fireEvent.click(screen.getByRole("button", { name: "Review and link" }));

		expect(navigateMock).toHaveBeenCalledWith({
			params: { rpApplicationUuid: "rp-application-1" },
			to: "/workspaces/rp-registration-adoption/$rpApplicationUuid",
		});
	});
});
