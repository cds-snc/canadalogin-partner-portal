import type { PropsWithChildren, ReactElement, ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { EnvironmentCredentialsPage } from "@/features/application-environments/pages/EnvironmentCredentialsPage";

const { mockedUseApplicationEnvironment } = vi.hoisted(() => ({
	mockedUseApplicationEnvironment: vi.fn(),
}));

vi.mock("@tanstack/react-router", () => ({
	useParams: () => ({
		applicationUuid: "application-uuid-1",
		environmentUuid: "environment-uuid-1",
	}),
}));

vi.mock("react-i18next", () => ({
	useTranslation: () => ({
		t: (key: string): string => {
			const translations: Record<string, string> = {
				"applicationEnvironmentManagement.configurationTab": "Configuration",
				"applicationEnvironmentManagement.credentialsComingSoonBody":
					"Credentials are coming soon.",
				"applicationEnvironmentManagement.credentialsComingSoonTitle":
					"Credentials coming soon",
				"applicationEnvironmentManagement.credentialsTab": "Credentials",
				"applicationEnvironmentManagement.credentialsTitle":
					"Environment credentials",
				"applicationEnvironmentManagement.tabsLabel": "Environment views",
			};
			return translations[key] ?? key;
		},
	}),
}));

vi.mock("@/fetch", () => ({
	getRequestErrorNotice: () => null,
}));

vi.mock(
	"@/features/application-environments/hooks/use-application-environment",
	() => ({ useApplicationEnvironment: mockedUseApplicationEnvironment })
);

vi.mock("@/components/ui", () => ({
	Grid: ({ children }: PropsWithChildren): ReactElement => <div>{children}</div>,
	Heading: ({
		children,
		tag,
	}: PropsWithChildren<{ tag: "h1" | "h2" }>): ReactElement => {
		const HeadingTag = tag;
		return <HeadingTag>{children}</HeadingTag>;
	},
	Notice: ({ children }: PropsWithChildren): ReactElement => (
		<section>{children}</section>
	),
	Tabs: ({
		ariaLabel,
		items,
	}: {
		ariaLabel: string;
		items: ReadonlyArray<{
			active?: boolean;
			href: string;
			label: ReactNode;
		}>;
	}): ReactElement => (
		<nav aria-label={ariaLabel}>
			{items.map((item) => (
				<a
					aria-current={item.active ? "page" : undefined}
					href={item.href}
					key={item.href}
				>
					{item.label}
				</a>
			))}
		</nav>
	),
	Text: ({ children }: PropsWithChildren): ReactElement => <p>{children}</p>,
}));

describe("EnvironmentCredentialsPage", () => {
	it("renders shared tabs with Credentials active", () => {
		mockedUseApplicationEnvironment.mockReturnValue({
			data: { partnerLabel: "Test environment" },
			error: null,
			isLoading: false,
		});

		render(<EnvironmentCredentialsPage />);

		expect(
			screen.getByRole("navigation", { name: "Environment views" })
		).toBeTruthy();
		expect(
			screen
				.getByRole("link", { name: "Credentials" })
				.getAttribute("aria-current")
		).toBe("page");
		expect(
			screen
				.getByRole("link", { name: "Configuration" })
				.getAttribute("href")
		).toBe(
			"/applications/application-uuid-1/environments/environment-uuid-1"
		);
	});
});