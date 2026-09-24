import type { CSSProperties, PropsWithChildren, ReactElement } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { EnvironmentsPage } from "@/features/application-environments/pages/EnvironmentsPage";

const { mockedUseApplicationEnvironments } = vi.hoisted(() => ({
	mockedUseApplicationEnvironments: vi.fn(),
}));

vi.mock("@tanstack/react-router", () => ({
	useNavigate: () => vi.fn(),
	useParams: () => ({ applicationUuid: "application-uuid-1" }),
	useSearch: () => ({ page: 1 }),
}));

vi.mock("react-i18next", () => ({
	useTranslation: (): {
		i18n: { resolvedLanguage: string };
		t: (key: string) => string;
	} => ({
		i18n: { resolvedLanguage: "en" },
		t: (key: string): string => {
			const translations: Record<string, string> = {
				"applicationEnvironments.connectAction": "Connect an environment",
				"applicationEnvironments.empty":
					"You have not created any application environments.",
				"applicationEnvironments.gettingStartedLink":
					"getting started with CanadaLogin.",
				"applicationEnvironments.gettingStartedPrefix": "Learn more about ",
				"applicationEnvironments.gettingStarted":
					"Learn more about getting started with CanadaLogin.",
				"applicationEnvironments.inProductionDescription":
					"Your production environment is live and available for use.",
				"applicationEnvironments.lastModified": "Last modified",
				"applicationEnvironments.productionStatuses":
					"Production environment statuses",
				"applicationEnvironments.sectionTitle": "Application environments",
				"applicationEnvironments.statusInProduction": "In production",
				"applicationEnvironments.statusSubmitted": "Submitted",
				"applicationEnvironments.submittedDescription":
					"Your production environment request has been submitted to CanadaLogin for review.",
				"applicationEnvironments.summary":
					"View and manage environments for this application.",
				"applicationEnvironments.switchApplication": "Switch application",
				"applicationEnvironments.title": "Environments",
			};
			return translations[key] ?? key;
		},
	}),
}));

vi.mock("@/components/ui", () => ({
	Button: ({ children }: PropsWithChildren): ReactElement => <button>{children}</button>,
	Card: ({
		badge,
		cardTitle,
		cardTitleTag,
		description,
		href,
		style,
	}: {
		badge?: string;
		cardTitle: string;
		cardTitleTag: "h3" | "h4" | "h5" | "h6";
		description?: string;
		href: string;
		style?: CSSProperties;
	}): ReactElement => {
		const CardTitle = cardTitleTag;
		return (
			<article style={style}>
				{badge ? <p>{badge}</p> : null}
				<CardTitle>
					<a href={href}>{cardTitle}</a>
				</CardTitle>
				{description ? <p>{description}</p> : null}
			</article>
		);
	},
	Details: ({ children, detailsTitle }: PropsWithChildren<{ detailsTitle: string }>): ReactElement => (
		<section>
			<h3>{detailsTitle}</h3>
			{children}
		</section>
	),
	Grid: ({ children }: PropsWithChildren): ReactElement => <div>{children}</div>,
	Heading: ({ children, tag }: PropsWithChildren<{ tag: "h1" | "h2" | "h3" }>): ReactElement => {
		const HeadingTag = tag;
		return <HeadingTag>{children}</HeadingTag>;
	},
	Icon: (): ReactElement => <span data-testid="switch-application-icon" />,
	Link: ({ children, href }: PropsWithChildren<{ href: string }>): ReactElement => (
		<a href={href}>{children}</a>
	),
	Notice: ({ children }: PropsWithChildren): ReactElement => <section>{children}</section>,
	Pagination: (): ReactElement => <nav aria-label="Application environment pages" />,
	Text: ({ children }: PropsWithChildren): ReactElement => <p>{children}</p>,
}));

vi.mock(
	"@/features/application-environments/hooks/use-application-environments",
	() => ({ useApplicationEnvironments: mockedUseApplicationEnvironments })
);

describe("EnvironmentsPage", () => {
	it("renders the supplied empty state without list controls", () => {
		mockedUseApplicationEnvironments.mockReturnValue({
			data: {
				application: {
					nameEn: "Benefits portal",
					nameFr: null,
					uuid: "application-uuid-1",
				},
				data: [],
				hasMore: false,
				itemsPerPage: 10,
				page: 1,
				totalCount: 0,
			},
			error: null,
			isLoading: false,
		});

		render(<EnvironmentsPage />);

		expect(
			screen.getByText("You have not created any application environments.")
		).toBeTruthy();
		expect(
			screen.queryByText("Production environment statuses")
		).toBeNull();
		expect(
			screen.queryByRole("navigation", {
				name: "Application environment pages",
			})
		).toBeNull();
	});

	it("passes badges only for submitted and production published environment cards", () => {
		mockedUseApplicationEnvironments.mockReturnValue({
			data: {
				application: {
					nameEn: "Benefits portal",
					nameFr: null,
					uuid: "application-uuid-1",
				},
				data: [
					{
						createdAt: "2026-09-17T00:00:00Z",
						partnerLabel: "Submitted production",
						statusCode: "submitted",
						tenantCode: "production",
						updatedAt: null,
						uuid: "environment-1",
					},
					{
						createdAt: "2026-09-17T00:00:00Z",
						partnerLabel: "Published production",
						statusCode: "published",
						tenantCode: "production",
						updatedAt: null,
						uuid: "environment-2",
					},
					{
						createdAt: "2026-09-17T00:00:00Z",
						partnerLabel: "Published test",
						statusCode: "published",
						tenantCode: "test",
						updatedAt: null,
						uuid: "environment-3",
					},
				],
				hasMore: false,
				itemsPerPage: 10,
				page: 1,
				totalCount: 3,
			},
			error: null,
			isLoading: false,
		});

		render(<EnvironmentsPage />);

		expect(screen.getByText("Submitted")).toBeTruthy();
		const inProductionBadge = screen.getByText("In production");
		expect(inProductionBadge).toBeTruthy();
		expect(
			inProductionBadge
				.closest("article")
				?.style.getPropertyValue("--gcds-card-badge-background-color")
		).toBe("var(--gcds-color-green-700)");
		expect(screen.getByText("Published test")).toBeTruthy();
		expect(screen.queryByText("Published")).toBeNull();
		expect(screen.getAllByText(/^Last modified:/)).toHaveLength(3);
	});

	it("renders page-level and environment links as placeholders", () => {
		mockedUseApplicationEnvironments.mockReturnValue({
			data: {
				application: {
					nameEn: "Benefits portal",
					nameFr: null,
					uuid: "application-uuid-1",
				},
				data: [
					{
						createdAt: "2026-09-17T00:00:00Z",
						partnerLabel: "Test environment",
						statusCode: "draft",
						tenantCode: "test",
						updatedAt: null,
						uuid: "environment-1",
					},
				],
				hasMore: false,
				itemsPerPage: 10,
				page: 1,
				totalCount: 1,
			},
			error: null,
			isLoading: false,
		});

		render(<EnvironmentsPage />);

		expect(
			screen.getByRole("link", { name: "Switch application" }).getAttribute("href")
		).toBe("#");
		expect(
			screen
				.getByRole("link", { name: "getting started with CanadaLogin." })
				.getAttribute("href")
		).toBe("#");
		expect(
			screen.getByRole("link", { name: "Test environment" }).getAttribute("href")
		).toBe("#");
		expect(screen.getByTestId("switch-application-icon")).toBeTruthy();
	});
});