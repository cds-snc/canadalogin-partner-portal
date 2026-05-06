import type { PropsWithChildren, ReactElement } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, describe, expect, it, vi } from "vitest";
import { RPApplicationUsagePage } from "@/features/workspaces/pages/RPApplicationUsagePage";
import { useSession } from "@/features/auth/hooks/use-session";

const mockNavigate = vi.fn();

vi.mock("react-i18next", () => ({
	useTranslation: (): {
		i18n: { language: string };
		t: (key: string, options?: Record<string, unknown>) => string;
	} => ({
		i18n: { language: "en" },
		t: (key: string, options?: Record<string, unknown>): string => {
			const translations: Record<string, string> = {
				"nav.home": "Home",
				"workspaces.applicationUsageTitle": `Application usage - ${options?.["name"] ?? ""}`,
				"workspaces.applicationUsageSummary": "Review daily sign-in activity for this RP application.",
				"workspaces.applicationUsageDateLabel": "Activity date",
				"workspaces.applicationUsageDateHint": "Choose a date within the last 89 days.",
				"workspaces.applicationUsageDateError": "Choose a date from today back to 89 days ago.",
				"workspaces.applicationUsageSearch": "Search",
				"workspaces.applicationUsageLoadMore": "Load more",
				"workspaces.applicationUsageNoEvents": "No activity for this day.",
				"workspaces.applicationUsageTotal": "Total logins",
				"workspaces.applicationUsageSucceeded": "Succeeded",
				"workspaces.applicationUsageFailed": "Failed",
				"workspaces.applicationUsageUser": "User",
				"workspaces.applicationUsageOrigin": "Origin",
				"workspaces.applicationUsageResult": "Result",
				"workspaces.applicationUsageIpVersion": "IP version",
				"workspaces.applicationUsageUnknownUser": "Unknown user",
				"workspaces.applicationUsageCountry": "Country",
				"workspaces.applicationUsageTime": "Time",
				"workspaces.applicationUsageBack": "Back to application",
				"workspaces.applicationManagementTitle": `RP Application - ${options?.["name"] ?? ""}`,
				"workspaces.applicationStatus": "Status",
				"workspaces.title": "Workspaces",
				"workspaces.loadingApplications": "Loading applications",
				"workspaces.errorLoading": "Unable to load workspaces",
				"workspaces.errorLoadingApplications": "Unable to load applications",
			};

			return translations[key] ?? key;
		},
	}),
}));

vi.mock("@tanstack/react-router", () => ({
	useNavigate: vi.fn(() => mockNavigate),
	useParams: vi.fn(() => ({
		rpApplicationUuid: "application-uuid-1",
		workspaceUuid: "workspace-uuid-1",
	})),
}));

vi.mock("@/components/layout", () => ({
	Breadcrumbs: (): ReactElement => <nav>Breadcrumbs</nav>,
	CenteredPageLayout: ({ children }: PropsWithChildren): ReactElement => (
		<div>{children}</div>
	),
}));

vi.mock("@/components/ui", () => ({
	Button: ({ children, disabled, onGcdsClick, type }: PropsWithChildren<{ disabled?: boolean; onGcdsClick?: () => void; type: "button" | "submit" | "link" | "reset" }>): ReactElement => (
		<button disabled={disabled} type={type === "link" ? "button" : type} onClick={onGcdsClick}>
			{children}
		</button>
	),
	DateInput: ({ errorMessage, format, legend, max, min, name, onInput, validateOn, value }: {
		errorMessage?: string;
		format?: string;
		legend: string;
		max?: string;
		min?: string;
		name: string;
		onInput?: (event: { target: { value: string } }) => void;
		validateOn?: string;
		value?: string;
	}): ReactElement => (
		<label>
			<span>{legend}</span>
			<input
				aria-label={legend}
				data-error-message={errorMessage}
				data-format={format}
				data-validate-on={validateOn}
				defaultValue={value}
				max={max}
				min={min}
				name={name}
				type="date"
				onInput={(event) =>
					onInput?.({ target: { value: event.currentTarget.value } })
				}
			/>
		</label>
	),
	Heading: ({ children }: PropsWithChildren): ReactElement => <h1>{children}</h1>,
	Notice: ({ children }: PropsWithChildren): ReactElement => <section>{children}</section>,
	Text: ({ children }: PropsWithChildren): ReactElement => <p>{children}</p>,
}));

vi.mock("@/components/ui/Toast", () => ({
	useToast: () => ({
		error: vi.fn(),
		success: vi.fn(),
	}),
}));

vi.mock("@/fetch/departments", () => ({
	getDepartmentById: vi.fn(async () => ({
		id: 7,
		name: "Health Canada",
		nameFr: "Sante Canada",
	})),
}));

vi.mock("@/fetch/workspaces", () => ({
	getCurrentUserWorkspaces: vi.fn(async () => [
		{
			created_at: "2026-04-08T00:00:00Z",
			created_by: 1,
			departmentId: 7,
			description: null,
			id: 1,
			is_deleted: false,
			name: "Health Workspace",
			slug: "health-workspace",
			updated_at: null,
			uuid: "workspace-uuid-1",
		},
	]),
	getRPApplications: vi.fn(async () => [
		{
			created_at: "2026-04-08T00:00:00Z",
			created_by: 1,
			ibm_sv_application_id: "ibm-app-1",
			id: 1,
			is_deleted: false,
			name: "Benefits Portal",
			settings: null,
			status: "active",
			uuid: "application-uuid-1",
			workspace_id: 1,
		},
	]),
	getRPApplicationUsageAuditTrail: vi.fn(async (_workspaceUuid: string, _applicationUuid: string, request: { selectedDate: string }) => ({
		events: request.selectedDate === "2026-04-09"
			? [
					{
						country: "Canada",
						ipVersion: 4,
						origin: "192.168.10.20",
						originDisplay: "192.168.xxx.xxx",
						result: "success",
						timeSeconds: 1744200000,
						username: "jane.doe@example.com",
						usernameDisplay: "ja***@example.com",
						usernameKnown: true,
					},
			  ]
			: [
					{
						country: "Canada",
						ipVersion: 6,
						origin: "2001:db8::1",
						originDisplay: "2001:0db8:xxxx:xxxx:xxxx:xxxx:xxxx:xxxx",
						result: "failure",
						timeSeconds: 1744113600,
						username: "UNKNOWN",
						usernameDisplay: "",
						usernameKnown: false,
					},
			  ],
		next: request.selectedDate === "2026-04-09" ? '"1744200000000", "event-2"' : null,
			total: 2,
	})),
	getRPApplicationUsageAuditTrailSearchAfter: vi.fn(async () => ({
		events: [
			{
				country: "Canada",
				ipVersion: 4,
				origin: "203.0.113.44",
				originDisplay: "203.0.xxx.xxx",
				result: "success",
				timeSeconds: 1744203600,
				username: "john.smith@example.com",
				usernameDisplay: "jo***@example.com",
				usernameKnown: true,
			},
		],
		next: null,
		total: 2,
	})),
	getRPApplicationUsageSummary: vi.fn(async (_workspaceUuid: string, _applicationUuid: string, selectedDate: string) =>
		selectedDate === "2026-04-09"
			? { failed: 2, succeeded: 9, total: 11 }
			: { failed: 1, succeeded: 4, total: 5 }
	),
}));

vi.mock("@/features/auth/hooks/use-session", () => ({
	useSession: vi.fn(),
}));

const mockedUseSession = vi.mocked(useSession);

const createQueryClient = (): QueryClient =>
	new QueryClient({
		defaultOptions: {
			queries: {
				retry: false,
			},
		},
	});

describe("RPApplicationUsagePage", () => {
	afterEach(() => {
		vi.useRealTimers();
		vi.clearAllMocks();
	});

	it("loads today by default, waits for search on date change, and appends results on load more", async () => {
		vi.useFakeTimers({ toFake: ["Date"] });
		vi.setSystemTime(new Date("2026-04-09T12:00:00Z"));

		mockedUseSession.mockReturnValue({
			currentUser: {
				authProvider: "gc-sso",
				authSubject: "subject-123",
				departmentUuid: "department-uuid-1",
				email: "jane@example.com",
				name: "Jane Doe",
				profileImageUrl: null,
				roleUuids: ["role-uuid-1"],
				tierUuid: null,
				uuid: "user-uuid-1",
				username: "jdoe",
			},
			isAuthenticated: true,
			isLoading: false,
			login: vi.fn(),
			logout: vi.fn(async () => undefined),
			refreshSession: vi.fn(async () => null),
		});

		const { getRPApplicationUsageAuditTrail, getRPApplicationUsageAuditTrailSearchAfter, getRPApplicationUsageSummary } = await import(
			"@/fetch/workspaces"
		);

		render(
			<QueryClientProvider client={createQueryClient()}>
				<RPApplicationUsagePage />
			</QueryClientProvider>
		);

		await waitFor(() => {
			expect(screen.getByText(/application usage - benefits portal/i)).toBeTruthy();
		});

		const today = new Date();
		const maxDate = today.toISOString().split("T")[0] ?? "";
		const minDateValue = new Date(today);
		minDateValue.setDate(minDateValue.getDate() - 89);
		const minDate = minDateValue.toISOString().split("T")[0] ?? "";

		const dateInput = screen.getByLabelText(/activity date/i);
		expect(dateInput.getAttribute("data-format")).toBe("full");
		expect(dateInput.getAttribute("data-validate-on")).toBe("submit");
		expect(dateInput.getAttribute("min")).toBe(minDate);
		expect(dateInput.getAttribute("max")).toBe(maxDate);
		expect((dateInput as HTMLInputElement).defaultValue).toBe(maxDate);

		await waitFor(() => {
			expect(vi.mocked(getRPApplicationUsageSummary)).toHaveBeenCalledWith(
				"workspace-uuid-1",
				"application-uuid-1",
				expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/)
			);
		});

		expect(screen.getByText(/^11$/)).toBeTruthy();
		expect(screen.getByText(/ja\*\*\*@example.com/i)).toBeTruthy();
		expect(screen.getByText(/192\.168\.xxx\.xxx/i)).toBeTruthy();
		expect(screen.getByRole("button", { name: /search/i })).toBeTruthy();

		fireEvent.input(screen.getByLabelText(/activity date/i), {
			target: { value: "2026-04-08" },
		});

		expect(vi.mocked(getRPApplicationUsageSummary)).toHaveBeenCalledTimes(1);
		expect(screen.queryByText(/^5$/)).toBeNull();

		fireEvent.click(screen.getByRole("button", { name: /search/i }));

		await waitFor(() => {
			expect(vi.mocked(getRPApplicationUsageSummary)).toHaveBeenCalledWith(
				"workspace-uuid-1",
				"application-uuid-1",
				"2026-04-08"
			);
		});

		await waitFor(() => {
			expect(screen.getByText(/^5$/)).toBeTruthy();
		});
		expect(screen.getByText(/unknown user/i)).toBeTruthy();

		fireEvent.input(screen.getByLabelText(/activity date/i), {
			target: { value: "2026-04-09" },
		});
		fireEvent.click(screen.getByRole("button", { name: /search/i }));

		await waitFor(() => {
			expect(screen.getByRole("button", { name: /load more/i })).toBeTruthy();
		});

		fireEvent.click(screen.getByRole("button", { name: /load more/i }));

		await waitFor(() => {
			expect(vi.mocked(getRPApplicationUsageAuditTrailSearchAfter)).toHaveBeenCalled();
		});
		expect(screen.getByText(/jo\*\*\*@example.com/i)).toBeTruthy();
		expect(vi.mocked(getRPApplicationUsageAuditTrail)).toHaveBeenCalled();
	});

	it("shows a date validation error and skips search when the date is outside the allowed range", async () => {
		mockedUseSession.mockReturnValue({
			currentUser: {
				authProvider: "gc-sso",
				authSubject: "subject-123",
				departmentUuid: "department-uuid-1",
				email: "jane@example.com",
				name: "Jane Doe",
				profileImageUrl: null,
				roleUuids: ["role-uuid-1"],
				tierUuid: null,
				uuid: "user-uuid-1",
				username: "jdoe",
			},
			isAuthenticated: true,
			isLoading: false,
			login: vi.fn(),
			logout: vi.fn(async () => undefined),
			refreshSession: vi.fn(async () => null),
		});

		const { getRPApplicationUsageSummary } = await import("@/fetch/workspaces");

		render(
			<QueryClientProvider client={createQueryClient()}>
				<RPApplicationUsagePage />
			</QueryClientProvider>
		);

		await waitFor(() => {
			expect(screen.getByText(/application usage - benefits portal/i)).toBeTruthy();
		});

		fireEvent.input(screen.getByLabelText(/activity date/i), {
			target: { value: "1900-01-01" },
		});
		fireEvent.click(screen.getByRole("button", { name: /search/i }));

		const dateInput = screen.getByLabelText(/activity date/i);
		await waitFor(() => {
			expect(dateInput.getAttribute("data-error-message")).toBe(
				"Choose a date from today back to 89 days ago."
			);
		});
		expect(vi.mocked(getRPApplicationUsageSummary)).toHaveBeenCalledTimes(1);
	});
});