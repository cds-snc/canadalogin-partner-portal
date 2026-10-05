import type { PropsWithChildren, ReactElement } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AcceptTermsPage from "@/features/auth/pages/AcceptTermsPage";

const { acceptTermsMock, navigateMock, refreshSessionMock, toastSuccessMock } =
	vi.hoisted(() => ({
		acceptTermsMock: vi.fn(),
		navigateMock: vi.fn(),
		refreshSessionMock: vi.fn(),
		toastSuccessMock: vi.fn(),
	}));

vi.mock("react-i18next", () => ({
	Trans: ({ i18nKey }: { i18nKey: string }): ReactElement => <>{i18nKey}</>,
	useTranslation: (): { t: (key: string) => string } => ({
		t: (key: string): string =>
			({
				"termsAndConditions.acceptButton": "Accept and continue",
				"termsAndConditions.accepting": "Processing...",
				"termsAndConditions.error": "Unable to accept terms.",
				"termsAndConditions.signOutButton": "Sign out",
				"termsAndConditions.success": "Terms accepted.",
				"termsAndConditions.title": "Before you continue",
				"termsAndConditions.intro": "You must accept the terms of use.",
			} as Record<string, string>)[key] ?? key,
	}),
}));

vi.mock("@tanstack/react-router", () => ({
	useNavigate: (): typeof navigateMock => navigateMock,
	useSearch: (): { redirect: string } => ({ redirect: "/applications" }),
}));

vi.mock("@/components/ui", () => ({
	Button: ({ children, disabled, href, onGcdsClick, type }: PropsWithChildren<{
		disabled?: boolean;
		href?: string;
		onGcdsClick?: () => void;
		type: "button" | "link" | "reset" | "submit";
	}>): ReactElement =>
		href ? (
			<a href={href}>{children}</a>
		) : (
			<button disabled={disabled} type={type === "link" ? "button" : type} onClick={onGcdsClick}>
				{children}
			</button>
		),
	Heading: ({ children, tag }: PropsWithChildren<{ tag: "h1" | "h2" }>): ReactElement =>
		tag === "h1" ? <h1>{children}</h1> : <h2>{children}</h2>,
	Link: ({ children, href }: PropsWithChildren<{ href: string }>): ReactElement => (
		<a href={href}>{children}</a>
	),
	Text: ({ children }: PropsWithChildren): ReactElement => <p>{children}</p>,
}));

vi.mock("@/fetch/user-terms", () => ({
	acceptTerms: acceptTermsMock,
}));

vi.mock("@/hooks", () => ({
	useSession: (): { refreshSession: typeof refreshSessionMock } => ({
		refreshSession: refreshSessionMock,
	}),
}));

vi.mock("@/components/ui/Toast", () => ({
	useToast: (): { success: typeof toastSuccessMock } => ({ success: toastSuccessMock }),
}));

describe("AcceptTermsPage", () => {
	beforeEach((): void => {
		acceptTermsMock.mockReset().mockResolvedValue({ message: "Terms accepted" });
		navigateMock.mockReset().mockResolvedValue(undefined);
		refreshSessionMock.mockReset().mockResolvedValue(undefined);
		toastSuccessMock.mockReset();
	});

	it("renders direct accept and sign-out actions", async (): Promise<void> => {
		render(<AcceptTermsPage />);

		expect(screen.getByRole("heading", { name: "Before you continue" })).toBeTruthy();
		expect(screen.getByRole("link", { name: "Sign out" }).getAttribute("href")).toBe("/logout");

		const acceptButton = screen.getByRole("button", {
			name: "Accept and continue",
		});
		expect((acceptButton as HTMLButtonElement).disabled).toBe(false);
		fireEvent.click(acceptButton);

		await vi.waitFor((): void => {
			expect(acceptTermsMock).toHaveBeenCalledTimes(1);
			expect(refreshSessionMock).toHaveBeenCalledTimes(1);
			expect(navigateMock).toHaveBeenCalledWith({
				replace: true,
				to: "/applications",
			});
			expect(toastSuccessMock).not.toHaveBeenCalled();
		});
	});
});