import type { ReactElement } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Header from "@/components/ui/Header";
import { useAppPreferencesState } from "@/hooks";

vi.mock("react-i18next", () => ({
	useTranslation: (): { t: (key: string) => string } => ({
		t: (key: string): string => {
			const translations: Record<string, string> = {
				"header.switchLanguageEnglish": "English",
				"header.switchLanguageFrench": "Français",
			};

			return translations[key] ?? key;
		},
	}),
}));

vi.mock("@gcds-core/components-react", () => ({
	GcdsSignature: ({ lang }: { lang: string }): ReactElement => <div data-lang={lang}>Signature</div>,
}));

vi.mock("@/hooks", () => ({
	useAppPreferencesState: vi.fn(),
}));

vi.mock("@/components/ui/AppNavigation", () => ({
	default: (): ReactElement => <nav>Navigation</nav>,
}));

describe("Header", () => {
	it("shows the switch-to-french label when the app is in English", () => {
		vi.mocked(useAppPreferencesState).mockReturnValue({
			language: "en",
			setLanguage: vi.fn((): Promise<void> => Promise.resolve()),
			toggleLanguage: vi.fn((): Promise<void> => Promise.resolve()),
		});

		render(<Header />);

		expect(screen.getByRole("button", { name: /français/i })).toBeTruthy();
		expect(screen.getByText("Signature").getAttribute("data-lang")).toBe("en");
	});

	it("toggles language when the switch button is pressed", () => {
		const toggleLanguage = vi.fn((): Promise<void> => Promise.resolve());

		vi.mocked(useAppPreferencesState).mockReturnValue({
			language: "fr",
			setLanguage: vi.fn((): Promise<void> => Promise.resolve()),
			toggleLanguage,
		});

		render(<Header />);

		fireEvent.click(screen.getByRole("button", { name: /english/i }));

		expect(toggleLanguage).toHaveBeenCalledTimes(1);
		expect(screen.getByText("Signature").getAttribute("data-lang")).toBe("fr");
	});
});