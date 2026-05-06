import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import AppNavigation from "@/components/ui/AppNavigation";
import { useSession } from "@/hooks";

const navigate = vi.fn((options: { replace?: boolean; to: string }): Promise<void> => {
	void options;

	return Promise.resolve();
});

vi.mock("react-i18next", () => ({
	useTranslation: (): { t: (key: string) => string } => ({
		t: (key: string): string => {
			const translations: Record<string, string> = {
				"nav.dashboard": "Dashboard",
				"nav.health": "Health",
				"nav.home": "Home",
				"nav.label": "Primary navigation",
				"nav.login": "Sign in",
				"nav.logout": "Sign out",
				"nav.policies": "Policies",
				"nav.profile": "Profile",
				"nav.roles": "Roles",
				"nav.tiers": "Tiers",
				"nav.users": "Users",
			};

			return translations[key] ?? key;
		},
	}),
}));

vi.mock("@tanstack/react-router", () => ({
	useNavigate: (): typeof navigate => navigate,
	useRouterState: ({ select }: { select: (state: { location: { pathname: string } }) => string }): string =>
		select({ location: { pathname: "/users" } }),
}));

vi.mock("@/hooks", () => ({
	useSession: vi.fn(),
}));

describe("AppNavigation", () => {
	it("shows authenticated links when a session exists", () => {
		const logout = vi.fn((): Promise<void> => Promise.resolve());

		vi.mocked(useSession).mockReturnValue({
			currentUser: {
				name: "Jane Doe",
				username: "jdoe",
				email: "jane@example.com",
				profileImageUrl: "https://example.com/jane.png",
				authProvider: "gc-sso",
				authSubject: "subject-123",
				roleUuids: ["role-uuid-3"],
				tierUuid: "tier-uuid-2",
				uuid: "user-uuid-7",
				isSuperuser: true,
			},
			isAuthenticated: true,
			isLoading: false,
			login: vi.fn(),
			logout,
			refreshSession: vi.fn((): Promise<null> => Promise.resolve(null)),
		});

		render(<AppNavigation />);

		expect(screen.getByRole("navigation", { name: /primary navigation/i })).toBeTruthy();
		expect(screen.getByRole("link", { name: /dashboard/i })).toBeTruthy();
		expect(screen.getByRole("link", { name: /users/i })).toBeTruthy();
		expect(screen.getByRole("link", { name: /policies/i })).toBeTruthy();
		expect(screen.getByRole("link", { name: /roles/i })).toBeTruthy();
		expect(screen.getByRole("link", { name: /tiers/i })).toBeTruthy();
		expect(screen.getByRole("button", { name: /sign out/i })).toBeTruthy();

		fireEvent.click(screen.getByRole("button", { name: /sign out/i }));

		return waitFor((): void => {
			expect(logout).toHaveBeenCalledTimes(1);
			expect(navigate).toHaveBeenCalledWith({ replace: true, to: "/" });
		});
	});

	it("shows the public sign-in link when no session exists", () => {
		vi.mocked(useSession).mockReturnValue({
			currentUser: null,
			isAuthenticated: false,
			isLoading: false,
			login: vi.fn(),
			logout: vi.fn((): Promise<void> => Promise.resolve()),
			refreshSession: vi.fn((): Promise<null> => Promise.resolve(null)),
		});

		render(<AppNavigation />);

		expect(screen.getByRole("link", { name: /home/i })).toBeTruthy();
		expect(screen.getByRole("link", { name: /health/i })).toBeTruthy();
		expect(screen.getByRole("link", { name: /sign in/i })).toBeTruthy();
	});
});