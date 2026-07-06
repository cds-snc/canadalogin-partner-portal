import type { PropsWithChildren, ReactElement } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { DepartmentSetupPage } from "@/features/your-applications/pages/DepartmentSetupPage";
import { HttpRequestError } from "@/fetch/errors";
import {
	assignCurrentUserRPApplicationDepartment,
	getCurrentUserRPApplicationDepartment,
} from "@/fetch/rp-applications";

const replaceMock = vi.fn();
const originalLocation = globalThis.location;

vi.mock("@tanstack/react-router", () => ({
	useParams: (): { rpApplicationUuid: string } => ({
		rpApplicationUuid: "application-uuid-1",
	}),
	useSearch: (): { redirect?: string } => ({}),
	useNavigate: (): (() => Promise<void>) => vi.fn().mockResolvedValue(undefined),
}));

vi.mock("react-i18next", () => ({
	useTranslation: (): { t: (key: string) => string } => ({
		t: (key: string): string => {
			const map: Record<string, string> = {
				"rpDepartmentSetup.chooseDepartment": "Choose a department",
				"rpDepartmentSetup.errorLoading": "Failed to load departments",
				"rpDepartmentSetup.errorSaving": "Failed to assign department",
				"rpDepartmentSetup.intro": "Select a department to continue.",
				"rpDepartmentSetup.loading": "Loading departments",
				"rpDepartmentSetup.noDepartments": "No departments available",
				"rpDepartmentSetup.save": "Assign department",
				"rpDepartmentSetup.departmentLabel": "Department",
				"rpDepartmentSetup.title": "Assign application department",
			};
			return map[key] ?? key;
		},
	}),
}));

vi.mock("@/features/departments/hooks/use-departments", () => ({
	useDepartments: vi.fn().mockReturnValue({
		departments: [
			{ uuid: "dept-uuid-1", name: "Agriculture Canada" },
			{ uuid: "dept-uuid-2", name: "Treasury Board" },
		],
		isLoading: false,
		error: null,
	}),
}));

vi.mock("@/fetch/rp-applications", async () => {
	const actual = await vi.importActual("@/fetch/rp-applications");
	return {
		...actual,
		getCurrentUserRPApplicationDepartment: vi.fn(),
		assignCurrentUserRPApplicationDepartment: vi.fn(),
	};
});

vi.mock("@/components/layout", () => ({
	CenteredPageLayout: ({ children }: PropsWithChildren): ReactElement => (
		<div>{children}</div>
	),
}));

vi.mock("@/components/ui", () => ({
	Button: ({
		children,
		onGcdsClick,
	}: PropsWithChildren<{ onGcdsClick?: () => void }>): ReactElement => (
		<button type="button" onClick={onGcdsClick}>
			{children}
		</button>
	),
	Heading: ({ children }: PropsWithChildren): ReactElement => <h1>{children}</h1>,
	Notice: ({
		children,
		noticeTitle,
	}: PropsWithChildren<{ noticeTitle: string }>): ReactElement => (
		<section>
			<h2>{noticeTitle}</h2>
			{children}
		</section>
	),
	Select: ({
		children,
	}: PropsWithChildren): ReactElement => (
		<select>{children}</select>
	),
	Text: ({ children }: PropsWithChildren): ReactElement => <p>{children}</p>,
}));

const mockedGetDepartment = vi.mocked(getCurrentUserRPApplicationDepartment);
const mockedAssignDepartment = vi.mocked(assignCurrentUserRPApplicationDepartment);

describe("YourApplicationsDepartmentSetupPage", () => {
	beforeAll(() => {
		Object.defineProperty(globalThis, "location", {
			configurable: true,
			value: {
				pathname:
					"/your-applications/application-uuid-1/department-setup",
				replace: replaceMock,
			} as Pick<Location, "pathname" | "replace">,
		});
	});

	afterEach(() => {
		replaceMock.mockReset();
		mockedGetDepartment.mockReset();
		mockedAssignDepartment.mockReset();
	});

	afterAll(() => {
		Object.defineProperty(globalThis, "location", {
			configurable: true,
			value: originalLocation,
		});
	});

	it("shows application name from preflight after load", async () => {
		mockedGetDepartment.mockResolvedValue({
			id: 10,
			uuid: "application-uuid-1",
			dnrAppName: "Benefits Portal",
			departmentId: null,
		});

		render(<DepartmentSetupPage />);

		await waitFor(() => {
			expect(screen.queryByText("Loading departments")).toBeNull();
		});

		await screen.findByRole("heading", { name: "Benefits Portal" });
	});

	it("shows setup instruction and department picker", async () => {
		mockedGetDepartment.mockResolvedValue({
			id: 10,
			uuid: "application-uuid-1",
			dnrAppName: "Benefits Portal",
			departmentId: null,
		});

		render(<DepartmentSetupPage />);

		await screen.findByText("Select a department to continue.");
		expect(screen.getByText("Assign department")).toBeTruthy();
	});

	it("does not show a cancel or back button", async () => {
		mockedGetDepartment.mockResolvedValue({
			id: 10,
			uuid: "application-uuid-1",
			dnrAppName: "Benefits Portal",
			departmentId: null,
		});

		render(<DepartmentSetupPage />);

		await screen.findByText("Assign department");

		const buttons = screen.getAllByRole("button");
		const cancelButton = buttons.find(
			(btn) =>
				btn.textContent?.toLowerCase().includes("cancel") ||
				btn.textContent?.toLowerCase().includes("back")
		);
		expect(cancelButton).toBeUndefined();
	});

	it("redirects to 403 route on forbidden preflight", async () => {
		mockedGetDepartment.mockRejectedValue(
			new HttpRequestError({ status: 403 })
		);

		render(<DepartmentSetupPage />);

		await waitFor(() => {
			expect(replaceMock).toHaveBeenCalledWith("/access-denied");
		});
	});

	it("redirects to 404 route on not-found preflight", async () => {
		mockedGetDepartment.mockRejectedValue(
			new HttpRequestError({ status: 404 })
		);

		render(<DepartmentSetupPage />);

		await waitFor(() => {
			expect(replaceMock).toHaveBeenCalledWith("/error?kind=not_found");
		});
	});

	it("navigates to rp-application details on 409 conflict (race condition)", async () => {
		const navigateMock = vi.fn().mockResolvedValue(undefined);

		vi.doMock("@tanstack/react-router", () => ({
			useParams: (): { rpApplicationUuid: string } => ({
				rpApplicationUuid: "application-uuid-1",
			}),
			useSearch: (): { redirect?: string } => ({}),
			useNavigate: (): typeof navigateMock => navigateMock,
		}));

		mockedGetDepartment.mockResolvedValue({
			id: 10,
			uuid: "application-uuid-1",
			dnrAppName: "Benefits Portal",
			departmentId: null,
		});
		mockedAssignDepartment.mockRejectedValue(
			new HttpRequestError({ status: 409 })
		);

		vi.doUnmock("@tanstack/react-router");
	});
});
