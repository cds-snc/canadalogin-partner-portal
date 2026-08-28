import type { PropsWithChildren, ReactElement } from "react";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { UserAccessPage } from "@/features/users/pages/UserAccessPage";
import { useUserAccessAdministration } from "@/features/users/hooks/use-user-access-administration";

vi.mock("@tanstack/react-router", () => ({
	Link: ({ children, to }: PropsWithChildren<{ to: string }>): ReactElement => (
		<a href={to}>{children}</a>
	),
	useParams: () => ({ userUuid: "user-uuid-1" }),
}));

vi.mock("react-i18next", () => ({
	useTranslation: () => ({
		t: (key: string, options?: Record<string, unknown>): string =>
			key === "users.accessTitle"
				? `Access for ${String(options?.["name"])}`
				: key === "users.pendingInvitationsTaskDescription"
					? `Review ${String(options?.["count"])} pending invitation.`
					: ({
							"users.accessTasksTitle": "Access tasks",
							"users.accountStatusActive": "Active",
							"users.addWorkspaceAccessAction": "Add workspace access",
							"users.addWorkspaceAccessTaskDescription":
								"Assign access in another workspace.",
							"users.globalAccessTaskDescription": "Review global access.",
							"users.manageGlobalAccessAction": "Manage global access",
							"users.manageWorkspaceAccessAction": "Manage workspace access",
							"users.profileSummaryTitle": "User",
							"users.returnToUsersAction": "Return to users and access",
							"users.reviewPendingInvitationsAction":
								"Review pending invitations",
							"users.workspaceAccessTaskDescription":
								"Review workspace access.",
						}[key] ?? key),
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
	Heading: ({
		children,
		tag,
	}: PropsWithChildren<{ tag: "h1" | "h2" | "h3" }>): ReactElement => {
		if (tag === "h1") return <h1>{children}</h1>;
		if (tag === "h3") return <h3>{children}</h3>;
		return <h2>{children}</h2>;
	},
	Notice: ({ children }: PropsWithChildren): ReactElement => (
		<section>{children}</section>
	),
	Text: ({ children }: PropsWithChildren): ReactElement => <p>{children}</p>,
}));

vi.mock("@/features/users/hooks/use-user-access-administration", () => ({
	useUserAccessAdministration: vi.fn(),
}));

const access = {
	globalAssignment: null,
	pendingInvitations: [{ invitationUuid: "invitation-uuid-1" }],
	user: {
		email: "person@example.test",
		enabled: true,
		name: "Person One",
		uuid: "user-uuid-1",
	},
	workspaceAssignments: [{ assignmentUuid: "assignment-uuid-1" }],
};

describe("UserAccessPage", () => {
	beforeEach(() => {
		vi.mocked(useUserAccessAdministration).mockReturnValue({
			access,
			error: null,
			isLoading: false,
		} as never);
	});

	it("renders a compact selected-user hub with focused task links", () => {
		render(<UserAccessPage />);

		expect(
			screen.getByRole("heading", { level: 1, name: "Access for Person One" })
		).toBeTruthy();
		expect(screen.getByText("person@example.test")).toBeTruthy();
		expect(screen.queryByRole("button")).toBeNull();
		expect(
			screen
				.getByRole("link", { name: "Manage global access" })
				.getAttribute("href")
		).toBe("/users/user-uuid-1/global-access");
		expect(
			screen
				.getByRole("link", { name: "Manage workspace access" })
				.getAttribute("href")
		).toBe("/users/user-uuid-1/workspace-access");
		expect(
			screen
				.getByRole("link", { name: "Add workspace access" })
				.getAttribute("href")
		).toBe("/users/user-uuid-1/workspace-access/new");
		expect(
			screen
				.getByRole("link", { name: "Review pending invitations" })
				.getAttribute("href")
		).toBe("/users/user-uuid-1/invitations");
	});

	it("summarizes the pending invitation count", () => {
		render(<UserAccessPage />);

		expect(screen.getByText("Review 1 pending invitation.")).toBeTruthy();
	});
});
