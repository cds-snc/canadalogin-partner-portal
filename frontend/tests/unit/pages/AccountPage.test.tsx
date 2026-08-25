import type { PropsWithChildren, ReactElement, ReactNode } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AccountPage } from "@/features/account/pages/AccountPage";
import { useWorkspaces } from "@/features/workspaces/hooks/use-workspaces";
import { useDevSession, useSession } from "@/hooks";

const { navigateMock, queryState } = vi.hoisted(() => ({
	navigateMock: vi.fn(),
	queryState: { data: { name: "Treasury Board of Canada Secretariat" } },
}));

vi.mock("@tanstack/react-router", () => ({
	useNavigate: () => navigateMock,
}));

vi.mock("@tanstack/react-query", () => ({
	useQuery: vi.fn(() => ({ ...queryState, error: null, isLoading: false })),
}));

vi.mock("@/common/use-document-title", () => ({
	useDocumentTitle: vi.fn(),
}));

vi.mock("@/features/workspaces/hooks/use-workspaces", () => ({
	useWorkspaces: vi.fn(),
}));

vi.mock("@/hooks", () => ({
	useDevSession: vi.fn(),
	useSession: vi.fn(),
}));

vi.mock("react-i18next", () => ({
	useTranslation: () => ({
		i18n: { language: "en" },
		t: (key: string, options: Record<string, unknown> = {}): string => {
			const translations: Record<string, string> = {
				"account.accessLoading": "Loading your access details.",
				"account.accessTitle": "Your access",
				"account.emailLabel": "Email address",
				"account.globalRoleLabel": "Platform role",
				"account.identityTitle": "Account details",
				"account.loading": "Loading your account.",
				"account.nameLabel": "Name",
				"account.noCanonicalAccess": "No access recorded.",
				"account.noOrganization": "No organization recorded",
				"account.organizationLabel": "Organization",
				"account.roleColumn": "Role",
				"account.summary": "Review your signed-in account.",
				"account.title": "Account",
				"account.workspaceAccessItemLabel": "workspace access records",
				"account.workspaceAccessTitle": "Partner workspace access",
				"account.workspaceColumn": "Partner workspace",
				"account.workspaceFallback": "Partner workspace {{number}}",
				"authorization.roles.clAdmin": "CanadaLogin administrator",
				"authorization.roles.rpAdmin": "RP administrator",
				"home.title": "Partner portal",
				"localDevPersona.clearAction": "Clear simulated session",
				"localDevPersona.clearingAction": "Clearing simulated session...",
				"localDevPersona.simulatedIdentity":
					"Signed in as {{name}} ({{email}}).",
				"localDevPersona.simulatedSessionLabel": "Simulated local session",
			};
			return (translations[key] ?? key).replace(
				/\{\{(?<name>\w+)\}\}/g,
				(_match: string, name: string) => String(options[name] ?? "")
			);
		},
	}),
}));

vi.mock("@/components/ui", () => ({
	Button: ({
		children,
		disabled,
		onGcdsClick,
	}: PropsWithChildren<{
		disabled?: boolean;
		onGcdsClick?: () => void;
	}>): ReactElement => (
		<button disabled={disabled} type="button" onClick={onGcdsClick}>
			{children}
		</button>
	),
	DataTable: ({
		columns,
		rows,
		title,
	}: {
		columns: Array<{ field: string; headerName: string }>;
		rows: Array<Record<string, unknown>>;
		title: string;
	}): ReactElement => (
		<table>
			<caption>{title}</caption>
			<thead>
				<tr>
					{columns.map((column) => (
						<th key={column.field}>{column.headerName}</th>
					))}
				</tr>
			</thead>
			<tbody>
				{rows.map((row) => (
					<tr key={String(row["workspaceName"])}>
						{columns.map((column) => (
							<td key={column.field}>{String(row[column.field])}</td>
						))}
					</tr>
				))}
			</tbody>
		</table>
	),
	DescriptionList: ({
		items,
	}: {
		items: Array<{ label: string; value: ReactNode }>;
	}): ReactElement => (
		<dl>
			{items.map((item) => (
				<div key={item.label}>
					<dt>{item.label}</dt>
					<dd>{item.value}</dd>
				</div>
			))}
		</dl>
	),
	Heading: ({
		children,
		tag,
	}: PropsWithChildren<{ tag: "h1" | "h2" | "h3" }>): ReactElement => {
		if (tag === "h1") return <h1>{children}</h1>;
		if (tag === "h3") return <h3>{children}</h3>;
		return <h2>{children}</h2>;
	},
	Notice: ({ children }: PropsWithChildren): ReactElement => (
		<section>{children}</section>
	),
	Text: ({ children }: PropsWithChildren): ReactElement => <p>{children}</p>,
}));

const partnerUser = {
	acceptedTermsAt: "2026-06-11T12:00:00Z",
	authorizationContext: {
		globalRole: null,
		partnerAccess: [
			{ role: "rp_admin", workspaceUuid: "workspace-alpha-uuid" },
		],
	},
	departmentAbbreviation: "TBS",
	departmentUuid: "department-uuid",
	email: "partner@example.com",
	name: "Partner Admin",
	profileImageUrl: "",
	termsVersion: "2026-01",
	tierUuid: null,
	uuid: "user-uuid",
	username: "partner@example.com",
};

describe("AccountPage", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(useSession).mockReturnValue({
			currentUser: partnerUser,
			isAuthenticated: true,
			isLoading: false,
			login: vi.fn(),
			logout: vi.fn(),
			refreshSession: vi.fn(() => Promise.resolve(partnerUser)),
		} as never);
		vi.mocked(useDevSession).mockReturnValue({
			clearSession: vi.fn(() => Promise.resolve()),
			currentFixture: null,
			devSession: null,
			error: null,
			isClearing: false,
			isLoading: false,
			isSelecting: false,
			selectFixture: vi.fn(),
		});
		vi.mocked(useWorkspaces).mockReturnValue({
			error: null,
			isLoading: false,
			refetch: vi.fn(),
			workspaces: [
				{
					departmentUuid: "department-uuid",
					name: "Benefits Workspace",
					uuid: "workspace-alpha-uuid",
				},
			],
		} as never);
	});

	it("shows safe identity and canonical workspace-role summaries without identifiers", () => {
		render(<AccountPage />);

		expect(
			screen.getByRole("heading", { level: 1, name: "Account" })
		).toBeTruthy();
		expect(screen.getByText("Partner Admin")).toBeTruthy();
		expect(screen.getByText("partner@example.com")).toBeTruthy();
		expect(
			screen.getByText("Treasury Board of Canada Secretariat")
		).toBeTruthy();
		expect(screen.getByText("Benefits Workspace")).toBeTruthy();
		expect(screen.getByText("RP administrator")).toBeTruthy();
		expect(document.body.textContent).not.toContain("workspace-alpha-uuid");
		expect(document.body.textContent).not.toContain("department-uuid");
	});

	it("does not fetch partner workspace names for a global-role account", () => {
		vi.mocked(useSession).mockReturnValue({
			currentUser: {
				...partnerUser,
				authorizationContext: { globalRole: "cl_admin", partnerAccess: [] },
			},
			isAuthenticated: true,
			isLoading: false,
			refreshSession: vi.fn(),
		} as never);

		render(<AccountPage />);

		expect(useWorkspaces).toHaveBeenCalledWith(false);
		expect(screen.getByText("CanadaLogin administrator")).toBeTruthy();
	});

	it("keeps the local simulated-session action on the focused account page", async () => {
		const browserUser = userEvent.setup();
		const clearSession = vi.fn(() => Promise.resolve());
		const refreshSession = vi.fn(() => Promise.resolve(null));
		vi.mocked(useDevSession).mockReturnValue({
			clearSession,
			currentFixture: {
				email: "partner@example.com",
				fixtureId: "partner-admin",
				globalRole: null,
				name: "Partner Admin",
				partnerAccess: [],
			},
			devSession: null,
			error: null,
			isClearing: false,
			isLoading: false,
			isSelecting: false,
			selectFixture: vi.fn(),
		});
		vi.mocked(useSession).mockReturnValue({
			currentUser: partnerUser,
			isAuthenticated: true,
			isLoading: false,
			refreshSession,
		} as never);

		render(<AccountPage />);
		await browserUser.click(
			screen.getByRole("button", { name: "Clear simulated session" })
		);

		await waitFor(() => expect(clearSession).toHaveBeenCalledTimes(1));
		expect(refreshSession).toHaveBeenCalledTimes(1);
		expect(navigateMock).toHaveBeenCalledWith({ replace: true, to: "/" });
	});
});
