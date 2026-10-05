import type { PropsWithChildren, ReactElement } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { GenericErrorPage } from "@/features/errors/pages/GenericErrorPage";

vi.mock("react-i18next", () => ({
	useTranslation: (): { t: (key: string) => string } => ({
		t: (key: string): string => {
			const map: Record<string, string> = {
				"genericError.dashboardAction": "Go to dashboard",
				"genericError.homeAction": "Go to home",
				"genericError.notFoundBody": "The page or resource you requested could not be found.",
				"genericError.notFoundTitle": "We could not find that page",
				"genericError.title": "Something went wrong",
				"genericError.unexpectedBody": "An unexpected error occurred while loading this page. Try again from the dashboard.",
				"genericError.unexpectedTitle": "Unexpected error",
			};
			return map[key] ?? key;
		},
	}),
}));

vi.mock("@/components/ui", () => ({
	Button: ({
		children,
		href,
	}: PropsWithChildren<{ href?: string }>): ReactElement => (
		<a href={href}>{children}</a>
	),
	Heading: ({ children, tag }: PropsWithChildren<{ tag?: string }>): ReactElement => {
		if (tag === "h2") {
			return <h2>{children}</h2>;
		}
		return <h1>{children}</h1>;
	},
	Notice: ({
		children,
		noticeTitle,
	}: PropsWithChildren<{ noticeTitle: string }>): ReactElement => (
		<section>
			<h2>{noticeTitle}</h2>
			{children}
		</section>
	),
	Text: ({ children }: PropsWithChildren): ReactElement => <p>{children}</p>,
}));

describe("GenericErrorPage", () => {
	it("renders unexpected variant", () => {
		render(<GenericErrorPage kind="unexpected" />);

		expect(
			screen.getByRole("heading", { name: "Unexpected error" })
		).toBeTruthy();
		expect(
			screen.getByText(
				/an unexpected error occurred while loading this page\. try again from the dashboard/i
			)
		).toBeTruthy();
	});
});
