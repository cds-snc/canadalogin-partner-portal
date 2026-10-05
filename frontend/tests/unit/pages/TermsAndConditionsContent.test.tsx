import type { PropsWithChildren, ReactElement } from "react";
import { I18nextProvider, initReactI18next } from "react-i18next";
import { createInstance } from "i18next";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import TermsAndConditionsContent from "@/features/auth/pages/TermsAndConditionsContent";

vi.mock("@/components/ui", () => ({
	Heading: ({ children }: PropsWithChildren): ReactElement => (
		<h1>{children}</h1>
	),
	Link: ({
		children,
		href,
	}: PropsWithChildren<{ href: string }>): ReactElement => (
		<a href={href}>{children}</a>
	),
	Text: ({
		children,
		marginBottom,
	}: PropsWithChildren<{ marginBottom?: string }>): ReactElement => (
		<p data-margin-bottom={marginBottom}>{children}</p>
	),
}));

describe("TermsAndConditionsContent", () => {
	it("renders linked terms, bold action text, and a tightly spaced bulleted list", async (): Promise<void> => {
		const i18n = createInstance();
		await i18n.use(initReactI18next).init({
			lng: "en",
			fallbackLng: "en",
			resources: {
				en: {
					translation: {
						termsAndConditions: {
							title: "Before you continue",
							intro:
								"To continue, accept the <termsLink>terms of use</termsLink>.",
							agreementIntro:
								"By selecting <acceptAction>Accept and continue</acceptAction>, you agree to:",
							responsibility1: "first responsibility",
							responsibility2: "second responsibility",
							responsibility3: "third responsibility",
							responsibility4: "fourth responsibility",
							responsibility5: "fifth responsibility",
							responsibility6: "sixth responsibility",
						},
					},
				},
			},
		});

		render(
			<I18nextProvider i18n={i18n}>
				<TermsAndConditionsContent />
			</I18nextProvider>
		);

		const termsLink = screen.getByRole("link", { name: "terms of use" });
		expect(termsLink.getAttribute("href")).toBe(
			"https://login.canada.ca/en/partners/terms-of-use/"
		);

		const agreementIntro = screen.getByText(/By selecting/);
		expect(agreementIntro.querySelector("strong")?.textContent).toBe(
			"Accept and continue"
		);
		expect(agreementIntro.getAttribute("data-margin-bottom")).toBe("0");

		const responsibilities = screen.getByRole("list");
		expect(responsibilities.classList.contains("list-disc")).toBe(true);
		expect(responsibilities.classList.contains("mt-0")).toBe(true);
		expect(responsibilities.querySelectorAll("li")).toHaveLength(6);
	});
});