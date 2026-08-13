import type { PropsWithChildren, ReactElement } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ApplicationInformationEditPage } from "@/features/workspaces/pages/ApplicationInformationEditPage";
import { useApplicationInformationManagement } from "@/features/workspaces/hooks/use-application-information-management";
import { useWorkspaceApplicationInformation } from "@/features/workspaces/hooks/use-workspace-application-information";

const navigateMock = vi.fn(() => Promise.resolve());
const updateApplicationInformationMock = vi.fn(() =>
	Promise.resolve({
		createdAt: "2026-07-30T15:00:00Z",
		createdBy: 42,
		deletedAt: null,
		id: 17,
		isDeleted: false,
		migrationOrTransitionPlan: "Updated transition plan",
		overview: "Updated overview",
		securityAndPrivacy: "Protected B controls apply",
		serviceNameEn: "Updated service",
		serviceNameFr: "Service mis a jour",
		technologyAndProtocol: "OIDC with backend mediation",
		updatedAt: "2026-07-30T15:30:00Z",
		usage: "Updated usage",
		uuid: "application-information-uuid-1",
		workspaceId: 9,
	})
);

vi.mock("react-i18next", () => ({
	useTranslation: (): { t: (key: string, options?: Record<string, unknown>) => string } => ({
		t: (key: string, options?: Record<string, unknown>): string => {
			const translations: Record<string, string> = {
				"workspaces.appInfoEdit": "Edit application information",
				"workspaces.appInfoEditSummary": "Update canonical bilingual application details before returning to the detail view.",
				"workspaces.appInfoMigrationOrTransitionPlanLabel": "Migration or transition plan",
				"workspaces.appInfoOverviewLabel": "Overview",
				"workspaces.appInfoSaveAction": "Save application information",
				"workspaces.appInfoSecurityAndPrivacyLabel": "Security and privacy",
				"workspaces.appInfoServiceNameEnLabel": "Service name (English)",
				"workspaces.appInfoServiceNameFrLabel": "Service name (French)",
				"workspaces.appInfoTechnologyAndProtocolLabel": "Technology and protocol",
				"workspaces.appInfoUsageLabel": "Usage",
				"workspaces.cancelAction": "Cancel",
			};

			if (key === "workspaces.appInfoEditPageTitle") {
				return `Edit application information - ${String(options?.["name"] ?? "")}`;
			}

			return translations[key] ?? key;
		},
	}),
}));

vi.mock("@tanstack/react-router", () => ({
	useNavigate: (): typeof navigateMock => navigateMock,
	useParams: (): { applicationInformationUuid: string; workspaceUuid: string } => ({
		applicationInformationUuid: "application-information-uuid-1",
		workspaceUuid: "workspace-uuid-1",
	}),
}));

vi.mock("@/components/ui", () => ({
	Button: ({ children, href, onGcdsClick, type }: PropsWithChildren<{ href?: string; onGcdsClick?: () => void; type: string }>): ReactElement =>
		type === "link" ? (
			<a href={href}>{children}</a>
		) : (
			<button onClick={onGcdsClick} type="button">
				{children}
			</button>
		),
	Heading: ({ children }: PropsWithChildren): ReactElement => <h1>{children}</h1>,
	Input: ({ inputId, label, onInput, value }: { inputId: string; label: string; onInput?: (event: { target: { value: string } }) => void; value?: string }): ReactElement => (
		<label htmlFor={inputId}>
			<span>{label}</span>
			<input
				id={inputId}
				value={value}
				onInput={(event): void => {
					onInput?.({ target: { value: (event.target as HTMLInputElement).value } });
				}}
			/>
		</label>
	),
	Notice: ({ children, noticeTitle }: PropsWithChildren<{ noticeTitle: string }>): ReactElement => (
		<section>
			<h2>{noticeTitle}</h2>
			{children}
		</section>
	),
	Text: ({ children }: PropsWithChildren): ReactElement => <p>{children}</p>,
	Textarea: ({ label, onInput, textareaId, value }: { label: string; onInput?: (event: { target: { value: string } }) => void; textareaId: string; value?: string }): ReactElement => (
		<label htmlFor={textareaId}>
			<span>{label}</span>
			<textarea
				id={textareaId}
				value={value}
				onInput={(event): void => {
					onInput?.({ target: { value: (event.target as HTMLTextAreaElement).value } });
				}}
			/>
		</label>
	),
}));

vi.mock("@/features/workspaces/hooks/use-workspace-application-information", () => ({
	useWorkspaceApplicationInformation: vi.fn(),
}));

vi.mock("@/features/workspaces/hooks/use-application-information-management", () => ({
	useApplicationInformationManagement: vi.fn(),
}));

describe("ApplicationInformationEditPage", () => {
	it("updates application information and redirects back to detail", async () => {
		vi.mocked(useWorkspaceApplicationInformation).mockReturnValue({
			applicationInformation: {
				createdAt: "2026-07-30T15:00:00Z",
				createdBy: 42,
				deletedAt: null,
				id: 17,
				isDeleted: false,
				migrationOrTransitionPlan: "Phased transition",
				overview: "Overview text",
				securityAndPrivacy: "Protected B controls apply",
				serviceNameEn: "Example service",
				serviceNameFr: "Service exemple",
				technologyAndProtocol: "OIDC with backend mediation",
				updatedAt: null,
				usage: "Partner onboarding usage",
				uuid: "application-information-uuid-1",
				workspaceId: 9,
			},
			error: null,
			isLoading: false,
			refetch: vi.fn((): Promise<unknown> => Promise.resolve()),
		});
		vi.mocked(useApplicationInformationManagement).mockReturnValue({
			createApplicationInformation: vi.fn(),
			deleteApplicationInformation: vi.fn(async () => undefined),
			isCreating: false,
			isDeleting: false,
			isUpdating: false,
			updateApplicationInformation: updateApplicationInformationMock,
		});

		render(<ApplicationInformationEditPage />);

		fireEvent.input(screen.getByLabelText(/service name \(english\)/i), {
			target: { value: "Updated service" },
		});
		fireEvent.input(screen.getByLabelText(/service name \(french\)/i), {
			target: { value: "Service mis a jour" },
		});
		fireEvent.input(screen.getByLabelText(/^overview$/i), {
			target: { value: "Updated overview" },
		});
		fireEvent.input(screen.getByLabelText(/^usage$/i), {
			target: { value: "Updated usage" },
		});
		fireEvent.input(screen.getByLabelText(/migration or transition plan/i), {
			target: { value: "Updated transition plan" },
		});
		fireEvent.click(
			screen.getByRole("button", { name: /save application information/i })
		);

		expect(updateApplicationInformationMock).toHaveBeenCalledWith(
			"workspace-uuid-1",
			"application-information-uuid-1",
			{
				migrationOrTransitionPlan: "Updated transition plan",
				overview: "Updated overview",
				securityAndPrivacy: "Protected B controls apply",
				serviceNameEn: "Updated service",
				serviceNameFr: "Service mis a jour",
				technologyAndProtocol: "OIDC with backend mediation",
				usage: "Updated usage",
			}
		);

		await waitFor(() => {
			expect(navigateMock).toHaveBeenCalledWith({
				params: {
					applicationInformationUuid: "application-information-uuid-1",
					workspaceUuid: "workspace-uuid-1",
				},
				replace: true,
				search: { updated: "1" },
				to: "/workspaces/$workspaceUuid/applications/$applicationInformationUuid",
			});
		});
	});
});