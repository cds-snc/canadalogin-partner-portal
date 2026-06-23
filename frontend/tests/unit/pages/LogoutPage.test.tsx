import type { ReactElement, ReactNode } from "react";
import { StrictMode } from "react";
import { render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LogoutPage } from "@/features/auth/pages/LogoutPage";

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

const { resetMock } = vi.hoisted(() => ({
	resetMock: vi.fn(),
}));

vi.mock("@/store", () => ({
	useAuthStore: (selector: (state: Record<string, unknown>) => unknown): unknown =>
		selector({ reset: resetMock }),
}));

describe("LogoutPage", (): void => {
	let locationHref = "";

	beforeEach(() => {
		resetMock.mockReset();
		locationHref = "";

		Object.defineProperty(window, "location", {
			configurable: true,
			value: {
				get href(): string {
					return locationHref;
				},
				set href(value: string) {
					locationHref = value;
				},
			},
		});
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("resets auth state on mount", async (): Promise<void> => {
		render(<LogoutPage />);

		await waitFor((): void => {
			expect(resetMock).toHaveBeenCalledTimes(1);
		});
	});

	it("resets auth state when effects are replayed in strict mode", async (): Promise<void> => {
		render(
			<StrictMode>
				<LogoutPage />
			</StrictMode>,
		);

		await waitFor((): void => {
			expect(resetMock).toHaveBeenCalled();
		});
	});

	it("navigates to backend logout after 2 seconds", async (): Promise<void> => {
		vi.useFakeTimers();
		render(<LogoutPage />);

		await vi.advanceTimersByTimeAsync(2000);

		expect(locationHref).toBe("/api/v1/logout");
	});
});