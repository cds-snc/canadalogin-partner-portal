import type { ReactElement } from "react";
import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Footer from "@/components/ui/Footer";

let footerProperties: Record<string, unknown> = {};

vi.mock("react-i18next", () => ({
	useTranslation: (): {
		i18n: { language: string };
		t: (key: string) => string;
	} => ({
		i18n: { language: "en" },
		t: (key: string): string => {
			const translations: Record<string, string> = {
					"footer.apiDocumentation": "API Documentation",
				"footer.contextualHeading": "Canadian Digital Service",
				"footer.privacy": "Privacy",
				"footer.support": "Support",
					"footer.systemStatus": "System status",
				"footer.terms": "Terms of use",
			};

			return translations[key] ?? key;
		},
	}),
}));

vi.mock("@gcds-core/components-react", () => ({
	GcdsFooter: (properties: Record<string, unknown>): ReactElement => {
		footerProperties = properties;
		return <footer />;
	},
}));

describe("Footer", () => {
	it("renders the compact contextual and sub-footer configuration", () => {
		render(<Footer />);

		expect(footerProperties).toMatchObject({
			contextualHeading: "Canadian Digital Service",
			contextualLinks: {
				"API Documentation": "#",
				Support: "/support",
				"System status": "#",
			},
			display: "compact",
			lang: "en",
			subLinks: {
				"Terms of use": "/terms-and-conditions",
				Privacy: "https://www.canada.ca/en/transparency/privacy.html",
			},
		});
	});
});
