import type { PropsWithChildren, ReactElement } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AdministrationPage } from "@/features/administration/pages/AdministrationPage";
import { useSession } from "@/hooks";

vi.mock("react-i18next", () => ({
	useTranslation: (): { t: (key: string) => string } => ({
		t: (key: string): string =>
			({
				"administration.groups.accessManagement": "Access management",
				"administration.groups.monitoringAndReference": "Role reference",
				"administration.summary": "Choose an identity and access task.",
				"administration.tasks.invitations": "Invite a partner user.",
				"administration.tasks.roleReference": "Review fixed roles.",
				"administration.tasks.usersAndAccess": "Manage users and access.",
				"administration.title": "Administration",
				"nav.invitations": "Invitations",
				"nav.roles": "Roles",
				"nav.usersAndAccess": "Users and access",
			})[key] ?? key,
	}),
}));

vi.mock("@/hooks", () => ({ useSession: vi.fn() }));

vi.mock("@/components", () => ({
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
	Container: ({ children }: PropsWithChildren): ReactElement => (
		<section>{children}</section>
	),
	Grid: ({ children }: PropsWithChildren): ReactElement => (
		<div>{children}</div>
	),
	Heading: ({
		children,
		tag,
	}: PropsWithChildren<{ tag: "h1" | "h2" }>): ReactElement =>
		tag === "h1" ? <h1>{children}</h1> : <h2>{children}</h2>,
	Text: ({ children }: PropsWithChildren): ReactElement => <p>{children}</p>,
}));

describe("AdministrationPage", () => {
	it("branches from one H1 to the fixed authorized administration tasks", () => {
		vi.mocked(useSession).mockReturnValue({
			currentUser: {
				acceptedTermsAt: "2026-06-11T12:00:00Z",
				authorizationContext: { globalRole: "cl_admin", partnerAccess: [] },
				departmentAbbreviation: "CDS",
				departmentUuid: "department-uuid-1",
				email: "admin@local.example",
				name: "CL Admin",
				profileImageUrl: "",
				termsVersion: "2026-01",
				uuid: "user-uuid-1",
				username: "admin@local.example",
			},
			isAuthenticated: true,
			isLoading: false,
			login: vi.fn(),
			logout: vi.fn(() => Promise.resolve()),
			refreshSession: vi.fn(() => Promise.resolve(null)),
		});

		render(<AdministrationPage />);

		expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
		expect(
			screen.getByRole("heading", { name: "Administration" })
		).toBeTruthy();
		for (const groupName of ["Access management", "Role reference"]) {
			expect(screen.getByRole("heading", { name: groupName })).toBeTruthy();
		}
		for (const [name, href] of [
			["Users and access", "/users"],
			["Invitations", "/users/invite"],
			["Roles", "/roles"],
		] as const) {
			expect(screen.getByRole("link", { name }).getAttribute("href")).toBe(
				href
			);
		}
		for (const retired of [/department/i, /tier/i, /polic/i, /audit/i]) {
			expect(screen.queryByRole("link", { name: retired })).toBeNull();
		}
	});
});
