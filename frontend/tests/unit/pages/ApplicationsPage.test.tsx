import type { PropsWithChildren, ReactElement } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ApplicationsPage } from "@/features/applications/pages/ApplicationsPage";
import { useSession } from "@/hooks";

const { mockedUseQuery } = vi.hoisted(() => ({
	mockedUseQuery: vi.fn(),
}));

vi.mock("react-i18next", () => ({
	useTranslation: (): {
		i18n: { resolvedLanguage: string };
		t: (key: string, options?: { count?: number }) => string;
	} => ({
		i18n: { resolvedLanguage: "en" },
		t: (key: string, options?: { count?: number }): string => {
			const translations: Record<string, string> = {
				"applications.emptyContactPrefix": "Contact ",
				"applications.emptyContactSuffix": " to request access to an application.",
				"applications.emptyTitle": "You do not have access to any applications.",
				"applications.loadingBody": "Loading applications.",
				"applications.loadingTitle": "Loading applications",
				"applications.paginationLabel": "Application pages",
				"applications.summary": "Select an application to manage its environments.",
				"applications.supportLink": "support",
				"applications.title": "Applications",
				"applications.unknownApplication": "Unknown application",
			};

			if (key === "applications.environmentCount") {
				return `${options?.count ?? 0} environments`;
			}

			return translations[key] ?? key;
		},
	}),
}));

vi.mock("@tanstack/react-query", () => ({
	useQuery: mockedUseQuery,
}));

vi.mock("@/components/ui", () => ({
	Card: ({
		cardTitle,
		description,
		href,
	}: {
		cardTitle: string;
		description?: string;
		href: string;
	}): ReactElement => (
		<article>
			<a href={href}>{cardTitle}</a>
			{description ? <p>{description}</p> : null}
		</article>
	),
	Grid: ({ children }: PropsWithChildren): ReactElement => <div>{children}</div>,
	Heading: ({ children }: PropsWithChildren): ReactElement => <h1>{children}</h1>,
	Link: ({ children, href }: PropsWithChildren<{ href: string }>): ReactElement => (
		<a href={href}>{children}</a>
	),
	Notice: ({ children, noticeTitle }: PropsWithChildren<{ noticeTitle: string }>): ReactElement => (
		<section>
			<h2>{noticeTitle}</h2>
			{children}
		</section>
	),
	Text: ({ children }: PropsWithChildren): ReactElement => <p>{children}</p>,
	Pagination: ({
		currentPage,
		label,
		totalPages,
	}: {
		currentPage: number;
		label: string;
		totalPages: number;
	}): ReactElement => (
		<nav aria-label={label}>
			{currentPage} of {totalPages}
		</nav>
	),
}));

vi.mock("@/hooks", () => ({
	useSession: vi.fn(),
}));

const mockedUseSession = vi.mocked(useSession);

const pageOneApplications = [
	{
		environmentCount: 0,
		nameEn: "Accessibility Tools",
		nameFr: "Outils d'accessibilite",
		uuid: "application-uuid-1",
	},
	{
		environmentCount: 0,
		nameEn: "Appeal Portal",
		nameFr: "Portail des appels",
		uuid: "application-uuid-2",
	},
	{
		environmentCount: 0,
		nameEn: "Audit Log Viewer",
		nameFr: "Visionneuse du journal d'audit",
		uuid: "application-uuid-3",
	},
	{
		environmentCount: 0,
		nameEn: "Benefit Calculator",
		nameFr: "Calculateur de prestations",
		uuid: "application-uuid-4",
	},
	{
		environmentCount: 11,
		nameEn: "Claims Service",
		nameFr: "Service de demandes",
		uuid: "application-uuid-5",
	},
	{
		environmentCount: 0,
		nameEn: "Compliance Checker",
		nameFr: "Verificateur de conformite",
		uuid: "application-uuid-6",
	},
	{
		environmentCount: 0,
		nameEn: "Configuration Panel",
		nameFr: "Panneau de configuration",
		uuid: "application-uuid-7",
	},
	{
		environmentCount: 0,
		nameEn: "Data Export Tool",
		nameFr: "Outil d'exportation de donnees",
		uuid: "application-uuid-8",
	},
	{
		environmentCount: 0,
		nameEn: "Documentation Hub",
		nameFr: "Centre de documentation",
		uuid: "application-uuid-9",
	},
	{
		environmentCount: 0,
		nameEn: "Notification Center",
		nameFr: "Centre de notifications",
		uuid: "application-uuid-10",
	},
];

const pageTwoApplications = [
	{
		environmentCount: 0,
		nameEn: "Payment Dashboard",
		nameFr: "Tableau de bord des paiements",
		uuid: "application-uuid-11",
	},
	{
		environmentCount: 0,
		nameEn: "Proof of Eligibility",
		nameFr: "Preuve d'admissibilite",
		uuid: "application-uuid-12",
	},
	{
		environmentCount: 0,
		nameEn: "Report Generator",
		nameFr: "Generateur de rapports",
		uuid: "application-uuid-13",
	},
	{
		environmentCount: 0,
		nameEn: "Status Tracker",
		nameFr: "Suivi du statut",
		uuid: "application-uuid-14",
	},
	{
		environmentCount: 0,
		nameEn: "User Profile Manager",
		nameFr: "Gestionnaire de profil utilisateur",
		uuid: "application-uuid-15",
	},
];

describe("ApplicationsPage", () => {
	it("renders application cards that open the environment page", () => {
		mockedUseQuery.mockReturnValue({
			data: {
				data: [
					{
						environmentCount: 2,
						nameEn: "Claims Service",
						nameFr: "Service de demandes",
						uuid: "application-uuid-2",
					},
					{
						environmentCount: 1,
						nameEn: "Benefits Portal",
						nameFr: "Portail de prestations",
						uuid: "application-uuid-1",
					},
				],
				hasMore: false,
				itemsPerPage: 10,
				page: 1,
				totalCount: 2,
			},
			hasMore: false,
			itemsPerPage: 10,
			page: 1,
			totalCount: 2,
			error: null,
			isLoading: false,
		});

		mockedUseSession.mockReturnValue({
			currentUser: {
				authProvider: "gc-sso",
				authSubject: "subject-123",
				departmentUuid: "department-uuid-1",
				email: "jane@example.com",
				name: "Jane Doe",
				profileImageUrl: null,
				roleUuids: [],
				tierUuid: null,
				uuid: "user-uuid-1",
			},
			hasHydrated: true,
			isAuthenticated: true,
			isLoading: false,
			login: vi.fn(),
			logout: vi.fn(async () => undefined),
			refreshSession: vi.fn(async () => null),
		});

		render(<ApplicationsPage />);

		expect(screen.getByRole("heading", { name: "Applications" })).toBeTruthy();
		expect(
			screen.getByRole("link", { name: "Benefits Portal" }).getAttribute("href")
		).toBe("/applications/application-uuid-1/environments");
		expect(screen.getByRole("link", { name: "Claims Service" })).toBeTruthy();
		expect(screen.getByRole("navigation").textContent).toBe("1 of 1");
	});

	it("uses server pagination metadata", () => {
		mockedUseQuery.mockReturnValue({
			data: {
				data: pageOneApplications,
				hasMore: true,
				itemsPerPage: 10,
				page: 1,
				totalCount: 15,
			},
			error: null,
			isLoading: false,
		});
		mockedUseSession.mockReturnValue({
			currentUser: {
				authProvider: "gc-sso",
				authSubject: "subject-123",
				email: "jane@example.com",
				name: "Jane Doe",
				profileImageUrl: null,
				roleUuids: [],
				tierUuid: null,
				uuid: "user-uuid-1",
			},
			hasHydrated: true,
			isAuthenticated: true,
			isLoading: false,
			login: vi.fn(),
			logout: vi.fn(async () => undefined),
			refreshSession: vi.fn(async () => null),
		});

		render(<ApplicationsPage />);

		expect(screen.getByRole("link", { name: "Claims Service" })).toBeTruthy();
		expect(screen.getByRole("navigation").textContent).toBe("1 of 2");
	});

	it("renders the second server page", () => {
		mockedUseQuery.mockReturnValue({
			data: {
				data: pageTwoApplications,
				hasMore: false,
				itemsPerPage: 10,
				page: 2,
				totalCount: 15,
			},
			error: null,
			isLoading: false,
		});
		mockedUseSession.mockReturnValue({
			currentUser: {
				authProvider: "gc-sso",
				authSubject: "subject-123",
				email: "jane@example.com",
				name: "Jane Doe",
				profileImageUrl: null,
				roleUuids: [],
				tierUuid: null,
				uuid: "user-uuid-1",
			},
			hasHydrated: true,
			isAuthenticated: true,
			isLoading: false,
			login: vi.fn(),
			logout: vi.fn(async () => undefined),
			refreshSession: vi.fn(async () => null),
		});

		render(<ApplicationsPage />);

		expect(screen.getByRole("link", { name: "Payment Dashboard" })).toBeTruthy();
		expect(screen.getByRole("link", { name: "User Profile Manager" })).toBeTruthy();
		expect(screen.queryByRole("link", { name: "Claims Service" })).toBeNull();
		expect(screen.getByRole("navigation").textContent).toBe("2 of 2");
	});

	it("renders the empty state", () => {
		mockedUseQuery.mockReturnValue({
			data: {
				data: [],
				hasMore: false,
				itemsPerPage: 10,
				page: 1,
				totalCount: 0,
			},
			error: null,
			isLoading: false,
		});
		mockedUseSession.mockReturnValue({
			currentUser: {
				authProvider: "gc-sso",
				authSubject: "subject-123",
				email: "jane@example.com",
				name: "Jane Doe",
				profileImageUrl: null,
				roleUuids: [],
				tierUuid: null,
				uuid: "user-uuid-1",
			},
			hasHydrated: true,
			isAuthenticated: true,
			isLoading: false,
			login: vi.fn(),
			logout: vi.fn(async () => undefined),
			refreshSession: vi.fn(async () => null),
		});

		render(<ApplicationsPage />);

		expect(
			screen.getByText("You do not have access to any applications.")
		).toBeTruthy();
		expect(
			screen.queryByText("Select an application to manage its environments.")
		).toBeNull();
		expect(screen.getByRole("link", { name: "support" }).getAttribute("href")).toBe(
			"/support"
		);
	});
});