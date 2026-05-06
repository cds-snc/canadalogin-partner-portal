import type { PropsWithChildren, ReactElement } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { WorkspaceClientCredentialsModal } from "@/features/workspaces/components/WorkspaceClientCredentialsModal";
import { getRPApplicationClientCredentials } from "@/fetch/workspaces";

vi.mock("react-i18next", () => ({
	useTranslation: (): {
		t: (key: string, options?: Record<string, unknown>) => string;
	} => ({
		t: (key: string): string => {
			const translations: Record<string, string> = {
				"common.close": "Close",
				"errors.unknown": "Something went wrong",
				"workspaces.applicationClientAction": "Client",
				"workspaces.applicationClientApplicationIdLabel": "IBM application ID",
				"workspaces.applicationClientApplicationLabel": "Application",
				"workspaces.applicationClientCopiedSuccess": "Client secret copied",
				"workspaces.applicationClientCopyAction": "Copy to clipboard",
				"workspaces.applicationClientHelp": "Use these credentials only where the relying party requires them.",
				"workspaces.applicationClientIdLabel": "Client ID",
				"workspaces.applicationClientIdCopiedSuccess": "Client ID copied",
				"workspaces.applicationClientModalTitle": "Client credentials",
				"workspaces.applicationClientRotateConfirmTitle": "Rotate client secret",
				"workspaces.applicationClientRotateOptionNamed": "Rotate Secret",
				"workspaces.applicationClientRotateOptionNamedHelp": "Create a second secret with a label and expiry date.",
				"workspaces.applicationClientRotateOptionRegenerate": "Regenerate Secret",
				"workspaces.applicationClientRotateOptionRegenerateHelp": "Immediately replace the current secret with a new value.",
				"workspaces.applicationClientSecretLabel": "Client secret",
				"workspaces.applicationClientSecretUnavailable": "No client secret available",
				"workspaces.applicationRotateSecretSuccess": "Client secret rotated",
				"workspaces.loadingApplications": "Loading applications",
			};

			return translations[key] ?? key;
		},
	}),
}));

const toastSuccess = vi.fn();
const toastError = vi.fn();

vi.mock("@/components/ui/Toast", () => ({
	useToast: (): { error: typeof toastError; success: typeof toastSuccess } => ({
		error: toastError,
		success: toastSuccess,
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
	Modal: ({ children, isOpen, title }: PropsWithChildren<{ isOpen: boolean; title: string }>): ReactElement | null =>
		isOpen ? (
			<section>
				<h2>{title}</h2>
				{children}
			</section>
		) : null,
}));

vi.mock("@/features/workspaces/components/WorkspaceClientSecretRegenerateModal", () => ({
	WorkspaceClientSecretRegenerateModal: (): ReactElement | null => null,
}));

vi.mock("@/features/workspaces/components/WorkspaceClientSecretRotateModal", () => ({
	WorkspaceClientSecretRotateModal: (): ReactElement | null => null,
}));

vi.mock("@/fetch/workspaces", () => ({
	getRPApplicationClientCredentials: vi.fn(),
}));

const renderModal = (): void => {
	const queryClient = new QueryClient({
		defaultOptions: {
			queries: { retry: false },
		},
	});

	render(
		<QueryClientProvider client={queryClient}>
			<WorkspaceClientCredentialsModal
				application={{
					created_at: "2026-04-02T00:00:00Z",
					created_by: 1,
					ibm_sv_application_id: "ibm-app-1",
					id: 101,
					is_deleted: false,
					name: "[DEPT] - Existing App",
					settings: null,
					status: "active",
					uuid: "application-uuid-1",
					workspace_id: 10,
				}}
				dateInputLang="en"
				isOpen={true}
				workspaceUuid="workspace-uuid-1"
				onClose={vi.fn()}
			/>
		</QueryClientProvider>
	);
};

describe("WorkspaceClientCredentialsModal", () => {
	beforeEach(() => {
		vi.mocked(getRPApplicationClientCredentials).mockResolvedValue({
			client_id: "client-id-123",
			client_secret: "top-secret-value",
			client_secret_id: "secret-1",
		});
		toastSuccess.mockReset();
		toastError.mockReset();
	});

	it("places the copy action with the client secret value and regenerate action with the title", async () => {
		renderModal();

		const secretHeading = await screen.findByText("Client secret");
		const secretValue = await screen.findByText("top-secret-value");
		const clientIdValue = await screen.findByText("client-id-123");
		const regenerateButton = screen.getByRole("button", { name: /regenerate secret/i });
		const clientIdRow = screen.getByTestId("workspace-client-id-row");
		const secretHeaderRow = screen.getByTestId("workspace-client-secret-header");
		const secretValueRow = screen.getByTestId("workspace-client-secret-value");

		expect(within(clientIdRow).getByRole("button", { name: /copy to clipboard/i })).toBeTruthy();
		expect(within(secretHeaderRow).getByRole("button", { name: /regenerate secret/i })).toBe(regenerateButton);
		expect(within(secretValueRow).getByRole("button", { name: /copy to clipboard/i })).toBeTruthy();
		expect(secretHeading).toBeTruthy();
		expect(secretValue).toBeTruthy();
		expect(clientIdValue).toBeTruthy();
	});
});