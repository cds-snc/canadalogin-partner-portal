import type { PropsWithChildren, ReactElement } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AccountNotFoundPage } from "@/features/auth/pages/AccountNotFoundPage";

const { buildApiUrlMock, resetMock } = vi.hoisted(() => ({
	buildApiUrlMock: vi.fn(() => "http://localhost:8000/api/v1/logout"),
	resetMock: vi.fn(),
}));

vi.mock("react-i18next", () => ({
	useTranslation: (): { t: (key: string) => string } => ({
		t: (key: string): string => {
			const translations: Record<string, string> = {
				"accountNotFound.title": "We could not find your account",
				"accountNotFound.summary": "You signed in successfully, but we could not find a CanadaLogin Partner Portal account associated with this email address.",
				"accountNotFound.reasonIntro": "This may happen if:",
				"accountNotFound.reasonDifferentEmail": "you used a different Government of Canada email address when your portal access was set up",
				"accountNotFound.reasonAccessNotSetUp": "your portal access has not been set up yet",
				"accountNotFound.existingAccessTitle": "If you already have access to the portal",
				"accountNotFound.existingAccessBody": "You may have signed in with a different Government of Canada email address from the one associated with your portal account.",
				"accountNotFound.signOutAction": "Sign out and try again",
				"accountNotFound.noAccessTitle": "If you have not been given access yet",
				"accountNotFound.requestAccess": "Request access from the CanadaLogin team.",
			};

			return translations[key] ?? key;
		},
	}),
}));

vi.mock("@/components/ui", () => ({
	Button: ({ children, onGcdsClick }: PropsWithChildren<{ onGcdsClick?: () => void }>): ReactElement => (
		<button type="button" onClick={onGcdsClick}>
			{children}
		</button>
	),
	Heading: ({ children, tag = "h1" }: PropsWithChildren<{ tag?: "h1" | "h2" }>): ReactElement => {
		const Tag = tag;
		return <Tag>{children}</Tag>;
	},
	Link: ({ children, href }: PropsWithChildren<{ href: string }>): ReactElement => (
		<a href={href}>{children}</a>
	),
	Text: ({
		children,
		marginBottom = "300",
	}: PropsWithChildren<{ marginBottom?: string }>): ReactElement => (
		<p data-margin-bottom={marginBottom}>{children}</p>
	),
}));

vi.mock("@/fetch/base-url", () => ({
	buildApiUrl: buildApiUrlMock,
}));

vi.mock("@/store", () => ({
	useAuthStore: (selector: (state: { reset: () => void }) => unknown): unknown =>
		selector({ reset: resetMock }),
}));

describe("AccountNotFoundPage", () => {
	beforeEach(() => {
		buildApiUrlMock.mockClear();
		resetMock.mockReset();
		Object.defineProperty(window, "location", {
			configurable: true,
			value: { href: "" },
		});
	});

	it("renders the account-not-found guidance from the design", () => {
		render(<AccountNotFoundPage />);

		expect(screen.getByRole("heading", { name: "We could not find your account" })).toBeTruthy();
		expect(screen.getByText(/You signed in successfully/)).toBeTruthy();
		const reasonIntro = screen.getByText("This may happen if:");
		expect(reasonIntro.getAttribute("data-margin-bottom")).toBe("0");
		expect(screen.getByRole("list").className).toContain("list-disc");
		expect(screen.getByRole("list").className).toContain("mt-0");
		expect(
			screen.getByText(
				"you used a different Government of Canada email address when your portal access was set up"
			)
		).toBeTruthy();
		expect(screen.getByText(/portal access has not been set up yet/)).toBeTruthy();
		expect(screen.getByRole("heading", { name: "If you already have access to the portal" })).toBeTruthy();
		expect(screen.getByRole("heading", { name: "If you have not been given access yet" })).toBeTruthy();
		expect(
			screen
				.getByRole("link", { name: "Request access from the CanadaLogin team." })
				.getAttribute("href")
		).toBe("/support");
	});

	it("signs out only when the user chooses to try again", () => {
		render(<AccountNotFoundPage />);

		expect(resetMock).not.toHaveBeenCalled();
		fireEvent.click(screen.getByRole("button", { name: "Sign out and try again" }));

		expect(resetMock).toHaveBeenCalledOnce();
		expect(buildApiUrlMock).toHaveBeenCalledWith("/api/v1/logout");
		expect(window.location.href).toBe("http://localhost:8000/api/v1/logout");
	});
});