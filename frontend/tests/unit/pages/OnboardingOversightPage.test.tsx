import type { PropsWithChildren, ReactElement } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { OnboardingOversightPage } from "@/features/onboarding-oversight/pages/OnboardingOversightPage";

vi.mock("react-i18next", () => ({
	useTranslation: () => ({
		t: (key: string): string =>
			({
				"onboardingOversight.overview.accessNoticeBody":
					"Metadata and task links only.",
				"onboardingOversight.overview.accessNoticeTitle":
					"Oversight access is metadata-only",
				"onboardingOversight.overview.invitationsBody":
					"Review pending invitations.",
				"onboardingOversight.overview.invitationsTitle": "Invitations",
				"onboardingOversight.overview.pageTitle": "Onboarding oversight",
				"onboardingOversight.overview.productionReviewsBody":
					"Review explicit requests.",
				"onboardingOversight.overview.productionReviewsTitle":
					"Production reviews",
				"onboardingOversight.overview.summary":
					"Choose an approved CL Admin task.",
				"onboardingOversight.overview.tasksTitle": "Oversight tasks",
				"onboardingOversight.overview.usersBody":
					"Review users and role assignments.",
				"onboardingOversight.overview.usersTitle": "Users and access",
				"onboardingOversight.overview.workspacesBody":
					"Review workspace tasks.",
				"onboardingOversight.overview.workspacesTitle": "Workspaces",
			})[key] ?? key,
	}),
}));

vi.mock("@/components/ui", () => ({
	Card: ({
		cardTitle,
		description,
		href,
	}: {
		cardTitle: string;
		description: string;
		href: string;
	}): ReactElement => (
		<article>
			<h3>
				<a href={href}>{cardTitle}</a>
			</h3>
			<p>{description}</p>
		</article>
	),
	Grid: ({ children }: PropsWithChildren): ReactElement => (
		<div>{children}</div>
	),
	Heading: ({
		children,
		tag,
	}: PropsWithChildren<{ tag?: string }>): ReactElement =>
		tag === "h2" ? <h2>{children}</h2> : <h1>{children}</h1>,
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

describe("OnboardingOversightPage", () => {
	it("anchors the four approved CL Admin task areas without backlog metrics", () => {
		render(<OnboardingOversightPage />);

		const expectedLinks = [
			["Workspaces", "/workspaces"],
			["Users and access", "/users"],
			["Invitations", "/users/invite"],
			["Production reviews", "/onboarding-oversight/queue"],
		];
		for (const [name, href] of expectedLinks) {
			expect(screen.getByRole("link", { name }).getAttribute("href")).toBe(
				href
			);
		}
		expect(screen.queryByText(/submitted records/i)).toBeNull();
		expect(screen.queryByText(/backlog/i)).toBeNull();
	});
});
