import type { ReactElement, ReactNode } from "react";
import { StrictMode } from "react";
import { render, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LogoutPage } from "@/features/auth/pages/LogoutPage";
import { useSession } from "@/hooks";

const navigate = vi.fn((options: { to: string }): Promise<void> => {
	void options;

	return Promise.resolve();
});

vi.mock("react-i18next", () => ({
	useTranslation: (): { t: (key: string) => string } => ({
		t: (key: string): string => {
			const translations: Record<string, string> = {
				"logout.title": "Signing you out",
				"logout.summary": "Closing the current backend session.",
			};

			return translations[key] ?? key;
		},
	}),
}));

vi.mock("@gcds-core/components-react", () => ({
	GcdsHeading: ({ children }: { children?: ReactNode }): ReactElement => <h1>{children}</h1>,
	GcdsText: ({ children }: { children?: ReactNode }): ReactElement => <p>{children}</p>,
}));

vi.mock("@/hooks", () => ({
	useSession: vi.fn(),
}));

vi.mock("@tanstack/react-router", () => ({
	useNavigate: (): typeof navigate => navigate,
}));

describe("LogoutPage", (): void => {
	it("logs the user out on mount", async (): Promise<void> => {
		const logout = vi.fn((): Promise<void> => Promise.resolve());
		vi.mocked(useSession).mockReturnValue({
			currentUser: null,
			isLoading: false,
			isAuthenticated: false,
			login: vi.fn(),
			logout,
			refreshSession: vi.fn((): Promise<null> => Promise.resolve(null)),
		});

		render(<LogoutPage />);

		await waitFor((): void => {
			expect(logout).toHaveBeenCalledTimes(1);
		});
		await waitFor((): void => {
			expect(navigate).toHaveBeenCalledWith({ replace: true, to: "/" });
		});
	});

	it("redirects after logout when effects are replayed in strict mode", async (): Promise<void> => {
		const logout = vi.fn((): Promise<void> => Promise.resolve());

		vi.mocked(useSession).mockReturnValue({
			currentUser: null,
			isLoading: false,
			isAuthenticated: false,
			login: vi.fn(),
			logout,
			refreshSession: vi.fn((): Promise<null> => Promise.resolve(null)),
		});

		render(
			<StrictMode>
				<LogoutPage />
			</StrictMode>,
		);

		await waitFor((): void => {
			expect(logout).toHaveBeenCalledTimes(1);
		});
		await waitFor((): void => {
			expect(navigate).toHaveBeenCalledWith({ replace: true, to: "/" });
		});
	});

	it("does not log out again on rerender when the hook returns a new logout function", async (): Promise<void> => {
		const logout = vi.fn((): Promise<void> => Promise.resolve());

		vi.mocked(useSession).mockImplementation(() => ({
			currentUser: null,
			isAuthenticated: false,
			isLoading: false,
			login: vi.fn(),
			logout: () => logout(),
			refreshSession: vi.fn((): Promise<null> => Promise.resolve(null)),
		}));

		const { rerender } = render(<LogoutPage />);

		await waitFor((): void => {
			expect(logout).toHaveBeenCalledTimes(1);
		});

		rerender(<LogoutPage />);

		await waitFor((): void => {
			expect(logout).toHaveBeenCalledTimes(1);
		});
	});
});