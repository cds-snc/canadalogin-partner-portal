import type { PropsWithChildren, ReactElement } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { WorkspaceRPApplicationForm } from "@/features/workspaces/components/WorkspaceRPApplicationForm";
import { createEmptyWorkspaceRPApplicationForm } from "@/features/workspaces/workspace-rp-application-form";

vi.mock("react-i18next", () => ({
	useTranslation: () => ({
		t: (key: string): string =>
			({
				"workspaces.applicationsEnvironmentLabel": "CanadaLogin environment",
				"workspaces.applicationsServiceNameEnLabel": "Service name (English)",
				"workspaces.applicationsServiceNameFrLabel": "Service name (French)",
			})[key] ?? key,
	}),
}));

vi.mock("@/components/ui", () => ({
	Button: ({ children }: PropsWithChildren): ReactElement => (
		<button type="button">{children}</button>
	),
	Checkboxes: (): null => null,
	Fieldset: ({ children }: PropsWithChildren): ReactElement => (
		<fieldset>{children}</fieldset>
	),
	Input: ({ label, name }: { label: string; name: string }): ReactElement => (
		<label>
			{label}
			<input name={name} />
		</label>
	),
	Radios: (): null => null,
	Select: ({
		children,
		label,
		name,
	}: PropsWithChildren<{ label: string; name: string }>): ReactElement => (
		<label>
			{label}
			<select name={name}>{children}</select>
		</label>
	),
	Text: ({ children }: PropsWithChildren): ReactElement => <p>{children}</p>,
	Textarea: (): null => null,
}));

describe("WorkspaceRPApplicationForm", () => {
	it("keeps both bilingual service names on the minimum Basics step", () => {
		render(
			<WorkspaceRPApplicationForm
				applicationInformationOptions={[]}
				cancelHref="/applications"
				form={createEmptyWorkspaceRPApplicationForm()}
				isSubmitting={false}
				step="basics"
				submitLabel="Continue"
				onChange={vi.fn()}
				onSubmit={vi.fn()}
			/>
		);

		expect(screen.getByLabelText("Service name (English)")).toBeTruthy();
		expect(screen.getByLabelText("Service name (French)")).toBeTruthy();
	});

	it("shows parent Application context without recollecting public names", () => {
		render(
			<WorkspaceRPApplicationForm
				applicationContextName="Benefits Portal"
				applicationInformationOptions={[]}
				cancelHref="/rp-configurations"
				form={createEmptyWorkspaceRPApplicationForm()}
				isSubmitting={false}
				step="basics"
				submitLabel="Continue"
				onChange={vi.fn()}
				onSubmit={vi.fn()}
			/>
		);

		expect(screen.getByText(/Benefits Portal/)).toBeTruthy();
		expect(screen.queryByLabelText("Service name (English)")).toBeNull();
		expect(screen.queryByLabelText("Service name (French)")).toBeNull();
	});

	it("uses a semantic form submission path for keyboard-compatible continuation", () => {
		const onSubmit = vi.fn();
		render(
			<WorkspaceRPApplicationForm
				applicationInformationOptions={[]}
				cancelHref="/applications"
				form={createEmptyWorkspaceRPApplicationForm()}
				isSubmitting={false}
				step="endpoints"
				submitLabel="Continue"
				onChange={vi.fn()}
				onSubmit={onSubmit}
			/>
		);

		const form = document.querySelector("form");
		expect(form).toBeTruthy();
		fireEvent.submit(form as HTMLFormElement);
		expect(onSubmit).toHaveBeenCalledTimes(1);
	});
});
