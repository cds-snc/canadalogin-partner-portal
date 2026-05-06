import type { PropsWithChildren, ReactElement } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { HealthPage } from "@/features/system/pages/HealthPage";
import { useSystemStatus } from "@/hooks";

vi.mock("react-i18next", () => ({
	useTranslation: (): { t: (key: string, options?: Record<string, string>) => string } => ({
		t: (key: string, options?: Record<string, string>): string => {
			const translations: Record<string, string> = {
				"nav.home": "Home",
				"health.title": "System health",
				"health.summary": "Backend health and readiness signals from the API.",
				"health.healthStatus": `Health status: ${options?.["status"] ?? ""}`,
				"health.readyStatus": `Ready status: ${options?.["status"] ?? ""}`,
				"health.databaseStatus": `Database: ${options?.["status"] ?? ""}`,
				"health.redisStatus": `Redis: ${options?.["status"] ?? ""}`,
			};

			return translations[key] ?? key;
		},
	}),
}));

vi.mock("@gcds-core/components-react", () => ({
	GcdsBreadcrumbs: ({ children }: PropsWithChildren): ReactElement => <nav>{children}</nav>,
	GcdsBreadcrumbsItem: ({ children }: PropsWithChildren): ReactElement => <span>{children}</span>,
	GcdsHeading: ({ children }: PropsWithChildren): ReactElement => <h1>{children}</h1>,
	GcdsNotice: ({ children }: PropsWithChildren): ReactElement => <section>{children}</section>,
	GcdsText: ({ children }: PropsWithChildren): ReactElement => <p>{children}</p>,
}));

vi.mock("@/hooks", () => ({
	useSystemStatus: vi.fn(),
}));

describe("HealthPage", () => {
	it("shows health and readiness data from the backend", () => {
		vi.mocked(useSystemStatus).mockReturnValue({
			health: {
				status: "ok",
				environment: "development",
				version: "0.1.0",
				timestamp: "2026-03-16T00:00:00Z",
			},
			ready: {
				status: "ok",
				environment: "development",
				version: "0.1.0",
				app: "ok",
				database: "ok",
				redis: "ok",
				timestamp: "2026-03-16T00:00:00Z",
			},
			isLoading: false,
		});

		const queryClient = new QueryClient();

		render(
			<QueryClientProvider client={queryClient}>
				<HealthPage />
			</QueryClientProvider>,
		);

		expect(screen.getByText(/health status: ok/i)).toBeTruthy();
		expect(screen.getByText(/ready status: ok/i)).toBeTruthy();
		expect(screen.getByText(/database: ok/i)).toBeTruthy();
		expect(screen.getByText(/redis: ok/i)).toBeTruthy();
	});
});