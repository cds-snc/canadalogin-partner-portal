import type { PropsWithChildren, ReactElement } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { RolesPage } from "@/features/roles/pages/RolesPage";

vi.mock("react-i18next", () => ({
	useTranslation: () => ({
		t: (key: string): string =>
			({
				"authorization.roles.clAdmin": "CL Admin",
				"authorization.roles.readOnly": "Read Only",
				"authorization.roles.rpAdmin": "RP Admin",
				"authorization.roles.rpUserEdit": "RP User (Edit)",
				"authorization.scopes.global": "Global",
				"authorization.scopes.workspace": "Workspace",
				"roles.immutableBody": "Role definitions cannot be changed here.",
				"roles.immutableTitle": "Canonical roles are fixed",
				"roles.summary": "Review the four canonical roles.",
				"roles.title": "Roles",
			})[key] ?? key,
	}),
}));

vi.mock("@/components/ui", () => ({
	DataTable: ({
		rows,
	}: {
		rows: Array<{ code: string; label: string }>;
	}): ReactElement => (
		<table>
			<tbody>
				{rows.map((row) => (
					<tr key={row.code}>
						<td>{row.label}</td>
						<td>{row.code}</td>
					</tr>
				))}
			</tbody>
		</table>
	),
	Heading: ({ children }: PropsWithChildren): ReactElement => (
		<h1>{children}</h1>
	),
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

describe("RolesPage", () => {
	it("renders the immutable four-role catalogue without mutation controls", () => {
		render(<RolesPage />);

		expect(
			screen.getByRole("heading", { name: "Canonical roles are fixed" })
		).toBeTruthy();
		expect(screen.getByText("CL Admin")).toBeTruthy();
		expect(screen.getByText("RP Admin")).toBeTruthy();
		expect(screen.getByText("RP User (Edit)")).toBeTruthy();
		expect(screen.getByText("Read Only")).toBeTruthy();
		expect(screen.queryByRole("button")).toBeNull();
	});
});
