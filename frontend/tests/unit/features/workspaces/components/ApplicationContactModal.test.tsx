import type { PropsWithChildren, ReactElement } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApplicationContactModal } from "@/features/workspaces/components/ApplicationContactModal";
import {
	createWorkspaceApplicationContact,
	type ApplicationContactRead,
	updateWorkspaceApplicationContact,
} from "@/fetch/application-info";

const successToast = vi.fn();
const errorToast = vi.fn();

vi.mock("react-i18next", () => ({
	useTranslation: (): { t: (key: string) => string } => ({
		t: (key: string): string => {
			const translations: Record<string, string> = {
				"common.cancel": "Cancel",
				"common.save": "Save",
				"common.saving": "Saving",
				"errors.unknown": "Something went wrong",
				"workspaces.appInfoContactAlternatePhoneNumberLabel": "Alternate phone number",
				"workspaces.appInfoContactTypesLabel": "Contact types",
				"workspaces.appInfoContactTypesSupportIncidentLegend": "Support and incident",
				"workspaces.appInfoContactTypesTier2Legend": "Tier 2",
				"workspaces.appInfoContactTypeAuthorizedIncidentProduction": "Authorized Incident Production",
				"workspaces.appInfoContactTypeAuthorizedIncidentTest": "Authorized Incident Test",
				"workspaces.appInfoContactTypeAuthorizedProduction": "Authorized Production",
				"workspaces.appInfoContactTypeAuthorizedTest": "Authorized Test",
				"workspaces.appInfoContactTypeComms": "Comms",
				"workspaces.appInfoContactTypeCyberAuthReport": "Cyber Auth Report",
				"workspaces.appInfoContactTypeFinancial": "Financial",
				"workspaces.appInfoContactTypeMainSupportContact": "Main support contact",
				"workspaces.appInfoContactTypeOnboardingWorkgroup": "Onboarding workgroup",
				"workspaces.appInfoContactTypeSecurityIncident": "Security Incident",
				"workspaces.appInfoContactCreatedSuccess": "Application contact created",
				"workspaces.appInfoContactEmailLabel": "Email",
				"workspaces.appInfoContactFirstNameLabel": "First name",
				"workspaces.appInfoContactLastNameLabel": "Last name",
				"workspaces.appInfoContactModalTitle": "Add application contact",
				"workspaces.appInfoContactPhoneNumberLabel": "Phone number",
				"workspaces.appInfoContactTitleRoleLabel": "Title / Role",
				"workspaces.appInfoEditContactModalTitle": "Edit application contact",
				"workspaces.appInfoContactUpdatedSuccess": "Application contact updated",
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
	Button: ({ children, disabled, onGcdsClick, type }: PropsWithChildren<{ disabled?: boolean; onGcdsClick?: () => void; type?: "button" | "submit" }>): ReactElement => (
		<button disabled={disabled} type={type ?? "button"} onClick={onGcdsClick}>{children}</button>
	),
	Checkboxes: ({ legend, name, onInput, options, value }: { legend?: string; name: string; onInput?: (event: { target: { name: string; value: string[] } }) => void; options: Array<{ id: string; label: string; value?: string }>; value?: string[] }): ReactElement => {
		const selectedValues = value ?? [];
		const optionValues = options.map((option) => option.value ?? option.label);
		const selectedGroupValues = selectedValues.filter((item) =>
			optionValues.includes(item)
		);
		return (
			<fieldset>
				{legend ? <legend>{legend}</legend> : null}
				{options.map((option) => {
					const optionValue = option.value ?? option.label;
					return (
						<label htmlFor={option.id} key={option.id}>
							<span>{option.label}</span>
							<input
								checked={selectedGroupValues.includes(optionValue)}
								id={option.id}
								name={name}
								type="checkbox"
								onChange={(event): void => {
									const nextValue = event.currentTarget.checked
										? [...selectedGroupValues, optionValue]
										: selectedGroupValues.filter((item) => item !== optionValue);
									onInput?.({ target: { name, value: nextValue } });
								}}
							/>
						</label>
					);
				})}
			</fieldset>
		);
	},
	Fieldset: ({ children, legend }: PropsWithChildren<{ legend: string }>): ReactElement => (
		<fieldset>
			<legend>{legend}</legend>
			{children}
		</fieldset>
	),
	Input: ({ inputId, label, name, onInput, value, type }: { inputId: string; label: string; name: string; onInput?: (event: { target: { value: string } }) => void; value?: string; type?: string }): ReactElement => (
		<label htmlFor={inputId}>
			<span>{label}</span>
			<input id={inputId} name={name} type={type} value={value} onInput={(event): void => onInput?.({ target: { value: (event.target as HTMLInputElement).value } })} />
		</label>
	),
	Modal: ({ children, isOpen, title }: PropsWithChildren<{ isOpen: boolean; title: string }>): ReactElement | null => isOpen ? <section><h2>{title}</h2>{children}</section> : null,
	Textarea: ({ label, name, onInput, textareaId, value }: { label: string; name: string; onInput?: (event: { target: { value: string } }) => void; textareaId: string; value?: string }): ReactElement => (
		<label htmlFor={textareaId}>
			<span>{label}</span>
			<textarea id={textareaId} name={name} value={value} onInput={(event): void => onInput?.({ target: { value: (event.target as HTMLTextAreaElement).value } })} />
		</label>
	),
}));

vi.mock("@/fetch/application-info", async (importOriginal) => {
	const actual = await importOriginal<
		typeof import("@/fetch/application-info")
	>();

	return {
		...actual,
		createWorkspaceApplicationContact: vi.fn(),
		updateWorkspaceApplicationContact: vi.fn(),
	};
});

const buildApplicationContact = (
	overrides: Partial<ApplicationContactRead> = {}
): ApplicationContactRead => ({
	applicationInfoId: 1,
	contactRoles: ["Main support contact"],
	createdAt: "2026-04-08T00:00:00Z",
	email: "alex@example.gc.ca",
	firstName: "Alex",
	id: 2,
	isDeleted: false,
	lastName: "Martin",
	phoneNumber: "555-111-2222",
	titleRole: "Product owner",
	uuid: "contact-uuid-1",
	...overrides,
});

const renderModal = (element: ReactElement): void => {
	const queryClient = new QueryClient({
		defaultOptions: {
			queries: {
				retry: false,
			},
		},
	});

	render(<QueryClientProvider client={queryClient}>{element}</QueryClientProvider>);
};

describe("ApplicationContactModal", () => {
	beforeEach(() => {
		successToast.mockReset();
		errorToast.mockReset();
		vi.mocked(createWorkspaceApplicationContact).mockReset();
		vi.mocked(updateWorkspaceApplicationContact).mockReset();
	});

	it("allows selecting tier 2 and support incident contact types together", async () => {
		vi.mocked(createWorkspaceApplicationContact).mockResolvedValue(
			buildApplicationContact({ uuid: "contact-uuid-2" })
		);
		const onClose = vi.fn();
		const onSaved = vi.fn(async () => undefined);

		renderModal(
			<ApplicationContactModal
				applicationInfoUuid="application-info-uuid-1"
				isOpen={true}
				onClose={onClose}
				onSaved={onSaved}
				workspaceUuid="workspace-uuid-1"
			/>
		);

		fireEvent.input(screen.getByLabelText(/first name/i), {
			target: { value: "Alex" },
		});
		fireEvent.input(screen.getByLabelText(/last name/i), {
			target: { value: "Martin" },
		});
		fireEvent.input(screen.getByLabelText(/title \/ role/i), {
			target: { value: "Director" },
		});
		fireEvent.input(screen.getByLabelText(/email/i), {
			target: { value: "alex@example.gc.ca" },
		});
		fireEvent.input(screen.getByLabelText(/^phone number$/i), {
			target: { value: "555-111-2222" },
		});
		fireEvent.click(screen.getByLabelText(/onboarding workgroup/i));
		fireEvent.click(screen.getByLabelText(/authorized incident production/i));
		fireEvent.click(screen.getByRole("button", { name: /^save$/i }));

		await waitFor(() => {
			expect(createWorkspaceApplicationContact).toHaveBeenCalledWith(
				"workspace-uuid-1",
				"application-info-uuid-1",
				expect.objectContaining({
					contactRoles: [
						"Onboarding workgroup",
						"Authorized Incident Production",
					],
				})
			);
		});
	});

	it("updates an existing application contact", async () => {
		vi.mocked(updateWorkspaceApplicationContact).mockResolvedValue(
			buildApplicationContact()
		);
		const onClose = vi.fn();
		const onSaved = vi.fn(async () => undefined);

		renderModal(
			<ApplicationContactModal
				applicationContact={buildApplicationContact()}
				applicationInfoUuid="application-info-uuid-1"
				isOpen={true}
				mode="edit"
				onClose={onClose}
				onSaved={onSaved}
				workspaceUuid="workspace-uuid-1"
			/>
		);

		expect(screen.queryByLabelText(/^action$/i)).toBeNull();
		expect(screen.queryByLabelText(/^contact type$/i)).toBeNull();

		fireEvent.input(screen.getByLabelText(/title \/ role/i), {
			target: { value: "Director" },
		});
		fireEvent.click(screen.getByLabelText(/comms/i));
		fireEvent.click(screen.getByLabelText(/authorized production/i));
		fireEvent.click(screen.getByRole("button", { name: /^save$/i }));

		await waitFor(() => {
			expect(updateWorkspaceApplicationContact).toHaveBeenCalledWith(
				"workspace-uuid-1",
				"application-info-uuid-1",
				"contact-uuid-1",
				expect.objectContaining({
					contactRoles: [
						"Main support contact",
						"Comms",
						"Authorized Production",
					],
					titleRole: "Director",
				})
			);
		});

		await waitFor(() => {
			expect(successToast).toHaveBeenCalledWith(
				"Application contact updated"
			);
			expect(onSaved).toHaveBeenCalled();
		});
	});
});