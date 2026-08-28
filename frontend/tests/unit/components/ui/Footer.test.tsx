import type { ReactElement } from "react";
import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Footer from "@/components/ui/Footer";

const languageState = vi.hoisted(() => ({ value: "en" }));
const footerProperties = vi.hoisted(() => vi.fn());

vi.mock("react-i18next", () => ({
	useTranslation: (): { i18n: { language: string } } => ({
		i18n: { language: languageState.value },
	}),
}));

vi.mock("@gcds-core/components-react", () => ({
	GcdsFooter: (properties: {
		lang: string;
		subLinks: Record<string, string>;
	}): ReactElement => {
		footerProperties(properties);
		return <footer />;
	},
}));

describe("Footer", () => {
	beforeEach(() => {
		footerProperties.mockClear();
		languageState.value = "en";
	});

	it("places Support in the English utility links", () => {
		render(<Footer />);

		expect(footerProperties).toHaveBeenCalledWith(
			expect.objectContaining({
				lang: "en",
				subLinks: expect.objectContaining({ Support: "/support" }),
			})
		);
	});

	it("provides equivalent French Support and terms utility links", () => {
		languageState.value = "fr";
		render(<Footer />);

		expect(footerProperties).toHaveBeenCalledWith(
			expect.objectContaining({
				lang: "fr",
				subLinks: expect.objectContaining({
					"Conditions d'utilisation": "/terms-and-conditions",
					Soutien: "/support",
				}),
			})
		);
	});
});
