import type { ReactElement, ReactNode } from "react";
import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { UserNavGroup } from "@/components/ui/UserNavGroup";
import { useSession } from "@/hooks";

vi.mock("react-i18next", () => ({
	useTranslation: (): { t: (key: string) => string } => ({
		t: (key: string): string => {
			const translations: Record<string, string> = {
				"nav.account": "Your account",
				"nav.manageProfile": "Manage profile",
				"nav.logout": "Sign out",
				"nav.organization": "Organization",
				"nav.roles": "Roles",
				"yourApplications.noDepartment": "No department assigned",
			};

			return translations[key] ?? key;
		},
	}),
}));

vi.mock("@/hooks", () => ({
	useSession: vi.fn(),
}));

vi.mock("@gcds-core/components-react", () => ({
	GcdsNavGroup: ({
		children,
		menuLabel,
	}: {
		children: ReactNode;
		menuLabel: string;
	}): ReactElement => <ul aria-label={menuLabel}>{children}</ul>,
	GcdsNavLink: ({
		children,
		href,
	}: {
		children: ReactNode;
		href: string;
	}): ReactElement => <a href={href}>{children}</a>,
}));

describe("UserNavGroup", () => {
	it("renders profile and sign-out actions in the account menu", () => {
		vi.mocked(useSession).mockReturnValue({
			currentUser: {
				name: "Jane Doe",
				email: "jane@example.com",
				profileImageUrl: "https://example.com/jane.png",
				authProvider: "gc-sso",
				authSubject: "subject-123",
				roleUuids: [],
				tierUuid: "tier-uuid-2",
				uuid: "user-uuid-7",
				isSuperuser: false,
			},
			isAuthenticated: true,
			isLoading: false,
			login: vi.fn(),
			logout: vi.fn((): Promise<void> => Promise.resolve()),
			refreshSession: vi.fn((): Promise<null> => Promise.resolve(null)),
		});

		render(<UserNavGroup />);

		expect(document.querySelector("ul[aria-label='Your account']")).toBeTruthy();
		expect(document.querySelector("a[href='/profile/setup']")?.textContent).toBe(
			"Manage profile"
		);
		expect(document.querySelector("a[href='/logout']")?.textContent).toBe(
			"Sign out"
		);
		expect(document.querySelectorAll("a")).toHaveLength(2);
		expect(document.body.textContent).not.toContain("jane@example.com");
	});
});
