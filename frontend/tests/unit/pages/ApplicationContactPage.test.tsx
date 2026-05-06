import type { PropsWithChildren, ReactElement } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ApplicationContactPage } from "@/features/workspaces/pages/ApplicationContactPage";

const mockNavigate = vi.fn();
const { mockedUseQuery } = vi.hoisted(() => ({
	mockedUseQuery: vi.fn(),
}));

vi.mock("react-i18next", () => ({
	useTranslation: (): {
		t: (key: string, options?: Record<string, unknown>) => string;
		i18n: { language: string };
	} => ({
		i18n: { language: "en" },
		t: (key: string): string => {
			const translations: Record<string, string> = {
				"nav.home": "Home",
				"workspaces.appInfoApplicationNameLabel": "Application name",
				"workspaces.appInfoContactModalTitle": "Add contact",
				"workspaces.appInfoEditContactModalTitle": "Edit contact",
				"workspaces.department": "Department",
				"workspaces.errorLoadingApplicationInfo": "Unable to load application information",
				"workspaces.loadingApplicationInfo": "Loading application information",
				"workspaces.title": "Workspaces",
				"workspaces.workspaceName": "Workspace name",
			};

			return translations[key] ?? key;
		},
	}),
}));

vi.mock("@tanstack/react-query", () => ({
	useQuery: mockedUseQuery,
}));

vi.mock("@tanstack/react-router", () => ({
	useNavigate: vi.fn(() => mockNavigate),
}));

vi.mock("@/components/layout", () => ({
	Breadcrumbs: (): ReactElement => <nav>Breadcrumbs</nav>,
	CenteredPageLayout: ({ children }: PropsWithChildren): ReactElement => <div>{children}</div>,
}));

vi.mock("@/components/ui", () => ({
	Heading: ({ children }: PropsWithChildren): ReactElement => <h1>{children}</h1>,
	Notice: ({ children }: PropsWithChildren): ReactElement => <section>{children}</section>,
	Text: ({ children }: PropsWithChildren): ReactElement => <p>{children}</p>,
}));

vi.mock("@/features/workspaces/components/ApplicationContactForm", () => ({
	ApplicationContactForm: (): ReactElement => <form>contact-form</form>,
}));

describe("ApplicationContactPage", () => {
	it("shows clear workspace and application context above the form", () => {
		mockedUseQuery.mockImplementation(({ queryKey }: { queryKey: Array<string> }) => {
			if (queryKey[0] === "workspace") {
				return {
					data: { departmentId: 7, name: "Health Workspace", uuid: "workspace-uuid-1" },
					isLoading: false,
				};
			}
			if (queryKey[0] === "workspace-application-info") {
				return {
					data: [{ applicationName: "Benefits Portal", uuid: "application-info-uuid-1" }],
					isLoading: false,
				};
			}
			if (queryKey[0] === "application-info-contacts") {
				return {
					data: [],
					isLoading: false,
				};
			}
			if (queryKey[0] === "department") {
				return {
					data: { name: "Health Canada", nameFr: "Sante Canada" },
					isLoading: false,
				};
			}
			return { data: null, isLoading: false };
		});

		render(
			<ApplicationContactPage
				applicationInfoUuid="application-info-uuid-1"
				mode="create"
				workspaceUuid="workspace-uuid-1"
			/>
		);

		expect(screen.getByRole("heading", { name: /add contact/i })).toBeTruthy();
		expect(screen.getByText(/workspace name/i)).toBeTruthy();
		expect(screen.getByText(/health workspace/i)).toBeTruthy();
		expect(screen.getByText(/application name/i)).toBeTruthy();
		expect(screen.getByText(/benefits portal/i)).toBeTruthy();
		expect(screen.getByText(/health canada/i)).toBeTruthy();
	});
});