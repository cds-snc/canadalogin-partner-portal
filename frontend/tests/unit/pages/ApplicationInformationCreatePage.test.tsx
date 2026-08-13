import type { PropsWithChildren, ReactElement } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ApplicationInformationCreatePage } from "@/features/workspaces/pages/ApplicationInformationCreatePage";
import { useApplicationInformationManagement } from "@/features/workspaces/hooks/use-application-information-management";

const navigateMock = vi.fn(() => Promise.resolve());
const createApplicationInformationMock = vi.fn(() =>
	Promise.resolve({
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
	})
);

vi.mock("react-i18next", () => ({
	useTranslation: (): { t: (key: string) => string } => ({
		t: (key: string): string => {
			const translations: Record<string, string> = {
				"workspaces.appInfoCreateButton": "Create application information",
				"workspaces.appInfoCreatePageTitle": "Create application information",
				"workspaces.appInfoCreateSummary": "Add canonical bilingual application details for this workspace.",
				"workspaces.appInfoMigrationOrTransitionPlanLabel": "Migration or transition plan",
				"workspaces.appInfoOverviewLabel": "Overview",
				"workspaces.appInfoSecurityAndPrivacyLabel": "Security and privacy",
				"workspaces.appInfoServiceNameEnLabel": "Service name (English)",
				"workspaces.appInfoServiceNameFrLabel": "Service name (French)",
				"workspaces.appInfoTechnologyAndProtocolLabel": "Technology and protocol",
				"workspaces.appInfoUsageLabel": "Usage",
				"workspaces.cancelAction": "Cancel",
			};

			return translations[key] ?? key;
		},
	}),
}));

vi.mock("@tanstack/react-router", () => ({
	useNavigate: (): typeof navigateMock => navigateMock,
	useParams: (): { workspaceUuid: string } => ({ workspaceUuid: "workspace-uuid-1" }),
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

vi.mock("@/features/workspaces/hooks/use-application-information-management", () => ({
	useApplicationInformationManagement: vi.fn(),
}));

describe("ApplicationInformationCreatePage", () => {
	it("creates application information and redirects to detail", async () => {
		vi.mocked(useApplicationInformationManagement).mockReturnValue({
			createApplicationInformation: createApplicationInformationMock,
			deleteApplicationInformation: vi.fn(async () => undefined),
			isCreating: false,
			isDeleting: false,
			isUpdating: false,
			updateApplicationInformation: vi.fn(),
		});

		render(<ApplicationInformationCreatePage />);

		fireEvent.input(screen.getByLabelText(/service name \(english\)/i), {
			target: { value: "Example service" },
		});
		fireEvent.input(screen.getByLabelText(/service name \(french\)/i), {
			target: { value: "Service exemple" },
		});
		fireEvent.input(screen.getByLabelText(/^overview$/i), {
			target: { value: "Overview text" },
		});
		fireEvent.input(screen.getByLabelText(/technology and protocol/i), {
			target: { value: "OIDC with backend mediation" },
		});
		fireEvent.input(screen.getByLabelText(/security and privacy/i), {
			target: { value: "Protected B controls apply" },
		});
		fireEvent.input(screen.getByLabelText(/^usage$/i), {
			target: { value: "Partner onboarding usage" },
		});
		fireEvent.input(screen.getByLabelText(/migration or transition plan/i), {
			target: { value: "Phased transition" },
		});
		fireEvent.click(
			screen.getByRole("button", { name: /create application information/i })
		);

		expect(createApplicationInformationMock).toHaveBeenCalledWith(
			"workspace-uuid-1",
			{
				migrationOrTransitionPlan: "Phased transition",
				overview: "Overview text",
				securityAndPrivacy: "Protected B controls apply",
				serviceNameEn: "Example service",
				serviceNameFr: "Service exemple",
				technologyAndProtocol: "OIDC with backend mediation",
				usage: "Partner onboarding usage",
			}
		);

		await waitFor(() => {
			expect(navigateMock).toHaveBeenCalledWith({
				params: {
					applicationInformationUuid: "application-information-uuid-1",
					workspaceUuid: "workspace-uuid-1",
				},
				replace: true,
				search: { created: "1" },
				to: "/workspaces/$workspaceUuid/applications/$applicationInformationUuid",
			});
		});
	});
});