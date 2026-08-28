import type { PropsWithChildren, ReactElement } from "react";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { WorkspaceSectionLayout } from "@/features/workspaces/components/WorkspaceSectionLayout";
import { useWorkspace } from "@/features/workspaces/hooks/use-workspace";

const routerState = vi.hoisted(() => ({
	pathname: "/workspaces/workspace-uuid-1/access",
	workspaceUuid: "workspace-uuid-1",
}));

vi.mock("react-i18next", () => ({
	useTranslation: () => ({
		t: (key: string, options?: Record<string, unknown>): string =>
			key === "workspaces.backToHub"
				? `Back to ${String(options?.["name"] ?? "Workspace")}`
				: key === "workspaces.workspaceLabel"
					? "Workspace"
					: key,
	}),
}));

vi.mock("@tanstack/react-router", () => ({
	useParams: () => ({ workspaceUuid: routerState.workspaceUuid }),
	useRouterState: ({
		select,
	}: {
		select: (state: { location: { pathname: string } }) => unknown;
	}): unknown => select({ location: { pathname: routerState.pathname } }),
}));

vi.mock("@/features/workspaces/hooks/use-workspace", () => ({
	useWorkspace: vi.fn(),
}));

vi.mock("@/components", () => ({
	Link: ({
		children,
		href,
	}: PropsWithChildren<{ href: string }>): ReactElement => (
		<a href={href}>{children}</a>
	),
}));

describe("WorkspaceSectionLayout", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		routerState.pathname = "/workspaces/workspace-uuid-1/access";
		vi.mocked(useWorkspace).mockReturnValue({
			error: null,
			isLoading: false,
			refetch: vi.fn(),
			workspace: { name: "Benefits Workspace", uuid: "workspace-uuid-1" },
		} as never);
	});

	it("uses full content width and provides a named workspace parent link", () => {
		render(
			<WorkspaceSectionLayout>
				<p>Page content</p>
			</WorkspaceSectionLayout>
		);

		expect(screen.queryByRole("navigation")).toBeNull();
		expect(
			screen
				.getByRole("link", { name: "Back to Benefits Workspace" })
				.getAttribute("href")
		).toBe("/workspaces/workspace-uuid-1");
		expect(document.body.textContent).not.toContain("workspace-uuid-1");
	});

	it("retains the more specific return path on nested routes", () => {
		routerState.pathname =
			"/workspaces/workspace-uuid-1/applications/application-uuid/edit";
		render(<WorkspaceSectionLayout>Nested page</WorkspaceSectionLayout>);

		expect(screen.queryByRole("link")).toBeNull();
		expect(screen.getByText("Nested page")).toBeTruthy();
	});
});
