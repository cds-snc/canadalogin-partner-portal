import type { PropsWithChildren, ReactElement } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { WorkspaceApplicationModal } from "@/features/workspaces/components/WorkspaceApplicationModal";
import { createRPApplication, updateRPApplication } from "@/fetch/workspaces";

const successToast = vi.fn();
const errorToast = vi.fn();

vi.mock("react-i18next", () => ({
	useTranslation: (): {
		t: (key: string, options?: Record<string, unknown>) => string;
	} => ({
		t: (key: string): string => {
			const translations: Record<string, string> = {
				"common.cancel": "Cancel",
				"common.save": "Save",
				"common.saving": "Saving",
				"errors.unknown": "Something went wrong",
				"workspaces.applicationClientTypeConfidentialOption": "Confidential",
				"workspaces.applicationClientTypeLabel": "Client type",
				"workspaces.applicationClientTypePublicOption": "Public",
				"workspaces.applicationCompanyNameLabel": "Company name",
				"workspaces.applicationCreatedSuccess": "Application created",
				"workspaces.applicationDescriptionLabel": "Description",
				"workspaces.applicationNameLabel": "Application name",
				"workspaces.applicationPkceDisabledOption": "PKCE disabled",
				"workspaces.applicationPkceEnabledOption": "PKCE enabled",
				"workspaces.applicationPkceLabel": "PKCE requirement",
				"workspaces.applicationRedirectUrisHint": "Enter one URI per line",
				"workspaces.applicationRedirectUrisLabel": "Redirect URIs",
				"workspaces.applicationUpdatedSuccess": "Application updated",
				"workspaces.applicationUrlLabel": "Application URL",
				"workspaces.createApplicationModalTitle": "Create application",
				"workspaces.editApplicationModalTitle": "Edit application",
			};

			return translations[key] ?? key;
		},
	}),
}));

vi.mock("@/components/ui/Toast", () => ({
	useToast: (): { error: typeof errorToast; success: typeof successToast } => ({
		error: errorToast,
		success: successToast,
	}),
}));

vi.mock("@/components/ui", () => ({
	Button: ({
		children,
		disabled,
		onGcdsClick,
		type,
	}: PropsWithChildren<{
		disabled?: boolean;
		onGcdsClick?: () => void;
		type?: "button" | "submit";
	}>): ReactElement => (
		<button disabled={disabled} type={type ?? "button"} onClick={onGcdsClick}>
			{children}
		</button>
	),
	Input: ({
		inputId,
		label,
		name,
		onInput,
		value,
	}: {
		inputId: string;
		label: string;
		name: string;
		onInput?: (event: { target: { value: string } }) => void;
		value?: string;
	}): ReactElement => (
		<label htmlFor={inputId}>
			<span>{label}</span>
			<input
				id={inputId}
				name={name}
				value={value}
				onInput={(event): void =>
					onInput?.({
						target: { value: (event.target as HTMLInputElement).value },
					})
				}
			/>
		</label>
	),
	Modal: ({
		children,
		isOpen,
		title,
	}: PropsWithChildren<{
		isOpen: boolean;
		title: string;
	}>): ReactElement | null =>
		isOpen ? (
			<section>
				<h2>{title}</h2>
				{children}
			</section>
		) : null,
	Select: ({
		children,
		label,
		onInput,
		selectId,
		value,
	}: PropsWithChildren<{
		label: string;
		onInput?: (event: { target: { value: string } }) => void;
		selectId: string;
		value?: string;
	}>): ReactElement => (
		<label htmlFor={selectId}>
			<span>{label}</span>
			<select
				id={selectId}
				value={value}
				onInput={(event): void =>
					onInput?.({
						target: { value: (event.target as HTMLSelectElement).value },
					})
				}
			>
				{children}
			</select>
		</label>
	),
	Textarea: ({
		label,
		name,
		onInput,
		textareaId,
		value,
	}: {
		label: string;
		name: string;
		onInput?: (event: { target: { value: string } }) => void;
		textareaId: string;
		value?: string;
	}): ReactElement => (
		<label htmlFor={textareaId}>
			<span>{label}</span>
			<textarea
				id={textareaId}
				name={name}
				value={value}
				onInput={(event): void =>
					onInput?.({
						target: { value: (event.target as HTMLTextAreaElement).value },
					})
				}
			/>
		</label>
	),
}));

vi.mock("@/fetch/workspaces", () => ({
	createRPApplication: vi.fn(),
	updateRPApplication: vi.fn(),
}));

const application = {
	created_at: "2026-04-02T00:00:00Z",
	created_by: 1,
	ibm_sv_application_id: "ibm-app-1",
	id: 101,
	is_deleted: false,
	name: "[DEPT] - Existing App",
	settings: {
		application_url: "https://existing.example.com",
		client_type: "confidential",
		company_name: "Existing Company",
		description: "Existing description",
		pkce_enabled: true,
		redirect_uris: ["https://existing.example.com/callback"],
	},
	status: "active",
	uuid: "application-uuid-1",
	workspace_id: 10,
};

describe("WorkspaceApplicationModal", () => {
	beforeEach(() => {
		successToast.mockReset();
		errorToast.mockReset();
		vi.mocked(createRPApplication).mockReset();
		vi.mocked(updateRPApplication).mockReset();
	});

	it("creates a workspace application", async () => {
		vi.mocked(createRPApplication).mockResolvedValue(application);
		const onClose = vi.fn();
		const onSaved = vi.fn(async () => undefined);

		render(
			<WorkspaceApplicationModal
				isOpen={true}
				mode="create"
				application={null}
				workspaceUuid="workspace-uuid-1"
				onClose={onClose}
				onSaved={onSaved}
			/>
		);

		fireEvent.input(screen.getByLabelText(/application name/i), {
			target: { value: "Partner Portal" },
		});
		fireEvent.input(screen.getByLabelText(/description/i), {
			target: { value: "Workspace-facing portal" },
		});
		fireEvent.input(screen.getByLabelText(/company name/i), {
			target: { value: "Natural Resources Canada" },
		});
		fireEvent.input(screen.getByLabelText(/application url/i), {
			target: { value: "https://portal.example.com" },
		});
		fireEvent.input(screen.getByLabelText(/client type/i), {
			target: { value: "public" },
		});
		fireEvent.input(screen.getByLabelText(/redirect uris/i), {
			target: {
				value:
					"https://portal.example.com/callback\nhttps://portal.example.com/logout",
			},
		});
		fireEvent.click(screen.getByRole("button", { name: /^save$/i }));

		await waitFor(() => {
			expect(createRPApplication).toHaveBeenCalledWith("workspace-uuid-1", {
				application_url: "https://portal.example.com",
				client_type: "public",
				company_name: "Natural Resources Canada",
				description: "Workspace-facing portal",
				name: "Partner Portal",
				pkce_enabled: true,
				redirect_uris: [
					"https://portal.example.com/callback",
					"https://portal.example.com/logout",
				],
			});
		});
		expect(successToast).toHaveBeenCalledWith("Application created");
		expect(onClose).toHaveBeenCalled();
		expect(onSaved).toHaveBeenCalled();
	});

	it("prefills create mode from application info context and links the new RP application", async () => {
		vi.mocked(createRPApplication).mockResolvedValue(application);
		const onClose = vi.fn();
		const onSaved = vi.fn(async () => undefined);

		render(
			<WorkspaceApplicationModal
				isOpen={true}
				mode="create"
				application={null}
				workspaceUuid="workspace-uuid-1"
				createContext={{
					applicationInfoUuid: "application-info-uuid-1",
					initialForm: {
						applicationUrl: "https://benefits.example.gc.ca",
						description: "Benefits access for citizens",
						companyName: "Department Name",
						name: "Benefits Portal",
					},
				}}
				onClose={onClose}
				onSaved={onSaved}
			/>
		);

		expect((screen.getByLabelText(/application name/i) as HTMLInputElement).value).toBe(
			"Benefits Portal"
		);
		expect((screen.getByLabelText(/description/i) as HTMLInputElement).value).toBe(
			"Benefits access for citizens"
		);
		expect((screen.getByLabelText(/company name/i) as HTMLInputElement).value).toBe(
			"Department Name"
		);
		expect((screen.getByLabelText(/application url/i) as HTMLInputElement).value).toBe(
			"https://benefits.example.gc.ca"
		);

		fireEvent.click(screen.getByRole("button", { name: /^save$/i }));

		await waitFor(() => {
			expect(createRPApplication).toHaveBeenCalledWith("workspace-uuid-1", {
				applicationInfoUuid: "application-info-uuid-1",
				application_url: "https://benefits.example.gc.ca",
				company_name: "Department Name",
				description: "Benefits access for citizens",
				name: "Benefits Portal",
				pkce_enabled: false,
				redirect_uris: [],
			});
		});
	});

	it("loads existing application values for editing", async () => {
		vi.mocked(updateRPApplication).mockResolvedValue(application);
		const onClose = vi.fn();
		const onSaved = vi.fn(async () => undefined);

		render(
			<WorkspaceApplicationModal
				isOpen={true}
				mode="edit"
				application={application}
				workspaceUuid="workspace-uuid-1"
				onClose={onClose}
				onSaved={onSaved}
			/>
		);

		expect((screen.getByLabelText(/application name/i) as HTMLInputElement).value).toBe(
			"[DEPT] - Existing App"
		);
		expect((screen.getByLabelText(/client type/i) as HTMLSelectElement).value).toBe(
			"confidential"
		);
		expect((screen.getByLabelText(/pkce requirement/i) as HTMLSelectElement).value).toBe(
			"true"
		);

		fireEvent.input(screen.getByLabelText(/company name/i), {
			target: { value: "Updated Company" },
		});
		fireEvent.input(screen.getByLabelText(/pkce requirement/i), {
			target: { value: "false" },
		});
		fireEvent.input(screen.getByLabelText(/description/i), {
			target: { value: "Updated description" },
		});
		fireEvent.click(screen.getByRole("button", { name: /^save$/i }));

		await waitFor(() => {
			expect(updateRPApplication).toHaveBeenCalledWith(
				"workspace-uuid-1",
				"application-uuid-1",
				{
					application_url: "https://existing.example.com",
					client_type: "confidential",
					company_name: "Updated Company",
					description: "Updated description",
					name: "[DEPT] - Existing App",
					pkce_enabled: false,
					redirect_uris: ["https://existing.example.com/callback"],
				}
			);
		});
		expect(successToast).toHaveBeenCalledWith("Application updated");
		expect(onClose).toHaveBeenCalled();
		expect(onSaved).toHaveBeenCalled();
	});
});