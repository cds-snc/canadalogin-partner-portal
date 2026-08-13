import type { PropsWithChildren, ReactElement } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ConflictRequestError, ServerRequestError } from "@/fetch";
import {
	useRPRegistrationAdoptionActions,
	useRPRegistrationAdoptionPreview,
} from "@/features/workspaces/hooks/use-rp-registration-adoption";
import { useWorkspaceApplicationInformationList } from "@/features/workspaces/hooks/use-workspace-application-information";
import { useWorkspaces } from "@/features/workspaces/hooks/use-workspaces";
import { RPRegistrationAdoptionDetailPage } from "@/features/workspaces/pages/RPRegistrationAdoptionDetailPage";

const linkToWorkspaceMock = vi.fn();
const refetchMock = vi.fn();

const translations: Record<string, string> = {
	"common.cancel": "Cancel",
	"common.no": "No",
	"common.notAvailable": "Not available",
	"common.notProvided": "Not provided",
	"common.yes": "Yes",
	"home.title": "Partner portal",
	"rpRegistrationAdoption.alreadyLinkedBody": "Return to the list.",
	"rpRegistrationAdoption.alreadyLinkedTitle": "Registration already linked",
	"rpRegistrationAdoption.applicationInformationHint": "Optional field.",
	"rpRegistrationAdoption.applicationRequired": "Choose an Application.",
	"rpRegistrationAdoption.applicationInformationLabel":
		"Application information",
	"rpRegistrationAdoption.chooseEnvironment": "Choose an environment",
	"rpRegistrationAdoption.chooseWorkspace": "Choose a workspace",
	"rpRegistrationAdoption.comparisonTitle": "Compare portal and IBM metadata",
	"rpRegistrationAdoption.confirmationBody": "IBM Verify is not updated.",
	"rpRegistrationAdoption.confirmationTitle": "Confirm the workspace link",
	"rpRegistrationAdoption.detailSummary": "Review and link.",
	"rpRegistrationAdoption.detailTitleFallback": "Adopt a registration",
	"rpRegistrationAdoption.environmentHint": "Choose the environment.",
	"rpRegistrationAdoption.environmentLabel": "CanadaLogin environment",
	"rpRegistrationAdoption.environmentRequired": "Choose an environment.",
	"rpRegistrationAdoption.environments.production": "Production",
	"rpRegistrationAdoption.environments.staging": "Staging",
	"rpRegistrationAdoption.environments.test": "Test",
	"rpRegistrationAdoption.fieldStatus.fillable": "Will be filled",
	"rpRegistrationAdoption.fields.redirectUris": "Redirect URIs",
	"rpRegistrationAdoption.formSummary": "Choose a destination.",
	"rpRegistrationAdoption.formTitle": "Choose the portal destination",
	"rpRegistrationAdoption.ibmBoundaryBody":
		"The portal does not change IBM Verify.",
	"rpRegistrationAdoption.ibmBoundaryTitle": "IBM Verify remains unchanged",
	"rpRegistrationAdoption.linkAction": "Link registration to workspace",
	"rpRegistrationAdoption.linkingAction": "Linking registration...",
	"rpRegistrationAdoption.noApplicationInformationOption": "None selected",
	"rpRegistrationAdoption.partnerEnvironmentContext": "Partner environment",
	"rpRegistrationAdoption.providerUnavailableBody": "Nothing was changed.",
	"rpRegistrationAdoption.providerUnavailableTitle":
		"IBM registration details unavailable",
	"rpRegistrationAdoption.retryAction": "Try again",
	"rpRegistrationAdoption.successTitle": "Registration linked",
	"rpRegistrationAdoption.viewApplicationAction": "View application",
	"rpRegistrationAdoption.viewWorkspaceAction": "View workspace",
	"rpRegistrationAdoption.backToCandidatesAction": "Return to candidates",
	"rpRegistrationAdoption.workspaceHint": "The department follows.",
	"rpRegistrationAdoption.workspaceLabel": "Partner workspace",
	"rpRegistrationAdoption.workspaceRequired": "Choose a workspace.",
};

vi.mock("react-i18next", () => ({
	useTranslation: () => ({
		t: (key: string, options?: Record<string, unknown>): string => {
			if (key === "rpRegistrationAdoption.detailTitle") {
				return `Adopt ${String(options?.["name"] ?? "")}`;
			}
			if (key === "rpRegistrationAdoption.successBody") {
				return `${String(options?.["name"] ?? "")} is linked.`;
			}
			if (key === "rpRegistrationAdoption.partnerEnvironmentContext") {
				return `Partner environment: ${String(options?.["environment"] ?? "")}`;
			}
			return translations[key] ?? key;
		},
	}),
}));

vi.mock("@tanstack/react-router", () => ({
	useParams: () => ({ rpApplicationUuid: "rp-application-1" }),
}));

vi.mock("@/components/ui", () => ({
	Button: ({ children, href, onGcdsClick, type }: any): ReactElement =>
		type === "link" ? (
			<a href={href}>{children}</a>
		) : (
			<button type="button" onClick={onGcdsClick}>
				{children}
			</button>
		),
	DataTable: ({ rows, title }: any): ReactElement => (
		<section>
			<h2>{title}</h2>
			{rows.map((row: any) => (
				<div
					key={row.field}
				>{`${row.field}: ${row.localValue}: ${row.providerValue}: ${row.status}`}</div>
			))}
		</section>
	),
	ErrorSummary: (): ReactElement => <div role="alert">Check your answers</div>,
	Heading: ({ children, tag }: any): ReactElement =>
		tag === "h2" ? <h2>{children}</h2> : <h1>{children}</h1>,
	Link: ({ children, href }: any): ReactElement => (
		<a href={href}>{children}</a>
	),
	Notice: ({ children, noticeTitle }: any): ReactElement => (
		<section>
			<h2>{noticeTitle}</h2>
			{children}
		</section>
	),
	Select: ({ children, errorMessage, label, onInput, value }: any) => (
		<label>
			{label}
			<select value={value} onInput={onInput} onChange={() => undefined}>
				{children}
			</select>
			{errorMessage ? <span>{errorMessage}</span> : null}
		</label>
	),
	Text: ({ children }: PropsWithChildren): ReactElement => <p>{children}</p>,
}));

vi.mock("@/features/workspaces/hooks/use-rp-registration-adoption", () => ({
	useRPRegistrationAdoptionActions: vi.fn(),
	useRPRegistrationAdoptionPreview: vi.fn(),
}));

vi.mock(
	"@/features/workspaces/hooks/use-workspace-application-information",
	() => ({ useWorkspaceApplicationInformationList: vi.fn() })
);

vi.mock("@/features/workspaces/hooks/use-workspaces", () => ({
	useWorkspaces: vi.fn(),
}));

const preview = {
	candidate: {
		configurationName: "Benefits production",
		ibmApplicationId: "ibm-app-1",
		metadataCompleteness: "incomplete" as const,
		missingFieldNames: ["redirectUris" as const],
		name: "Benefits Portal",
		partnerEnvironment: null,
		rpApplicationUuid: "rp-application-1",
		updatedAt: null,
	},
	partnerEnvironment: null,
	canadaLoginEnvironment: null,
	conflictingFieldNames: [],
	fields: [
		{
			fieldName: "redirectUris" as const,
			localValue: [],
			providerValue: ["https://benefits.example/callback"],
			status: "fillable" as const,
		},
	],
	fillableFieldNames: ["redirectUris" as const],
	preservedLocalFieldNames: [],
};

describe("RPRegistrationAdoptionDetailPage", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(useRPRegistrationAdoptionPreview).mockReturnValue({
			error: null,
			isLoading: false,
			preview,
			refetch: refetchMock,
		});
		vi.mocked(useRPRegistrationAdoptionActions).mockReturnValue({
			isLinking: false,
			linkToWorkspace: linkToWorkspaceMock,
		});
		vi.mocked(useWorkspaces).mockReturnValue({
			error: null,
			isLoading: false,
			refetch: vi.fn(),
			workspaces: [
				{
					createdAt: "2026-08-12T00:00:00Z",
					createdBy: 1,
					deletedAt: null,
					description: null,
					departmentId: 2,
					id: 3,
					isDeleted: false,
					name: "Benefits Workspace",
					slug: "benefits",
					updatedAt: null,
					uuid: "workspace-1",
				},
			],
		});
		vi.mocked(useWorkspaceApplicationInformationList).mockReturnValue({
			applicationInformationRecords: [
				{
					createdAt: "2026-08-12T00:00:00Z",
					createdBy: 42,
					deletedAt: null,
					id: 17,
					isDeleted: false,
					migrationOrTransitionPlan: "Plan",
					overview: "Overview",
					securityAndPrivacy: "Protected B",
					serviceNameEn: "Benefits Portal",
					serviceNameFr: "Portail des prestations",
					technologyAndProtocol: "OIDC",
					updatedAt: null,
					usage: "Usage",
					uuid: "application-information-1",
					workspaceId: 3,
				},
			],
			error: null,
			isLoading: false,
			refetch: vi.fn(),
		});
	});

	it("shows the safe comparison and explicit no-IBM-write boundary", () => {
		render(<RPRegistrationAdoptionDetailPage />);

		expect(
			screen.getByRole("heading", { name: "IBM Verify remains unchanged" })
		).toBeTruthy();
		expect(screen.getByText(/benefits.example\/callback/i)).toBeTruthy();
		expect(screen.getByText("Partner environment: Not provided")).toBeTruthy();
		expect(
			screen.queryByRole("textbox", { name: /partner environment/i })
		).toBeNull();
	});

	it("requires the workspace and unresolved environment before linking", () => {
		render(<RPRegistrationAdoptionDetailPage />);
		fireEvent.click(
			screen.getByRole("button", { name: "Link registration to workspace" })
		);

		expect(screen.getByRole("alert")).toBeTruthy();
		expect(screen.getByText("Choose a workspace.")).toBeTruthy();
		expect(screen.getByText("Choose an environment.")).toBeTruthy();
		expect(linkToWorkspaceMock).not.toHaveBeenCalled();
	});

	it("links the retained record and exposes the workspace and RP destinations", async () => {
		linkToWorkspaceMock.mockResolvedValue({
			applicationInformationUuid: "application-information-1",
			canadaLoginEnvironment: "production",
			conflictingFieldNames: [],
			departmentUuid: "department-1",
			filledFieldNames: ["redirectUris"],
			ibmApplicationId: "ibm-app-1",
			idempotentReplay: false,
			name: "Benefits Portal",
			configurationName: "Benefits production",
			partnerEnvironment: null,
			preservedLocalFieldNames: [],
			rpApplicationUuid: "rp-application-1",
			workspaceUuid: "workspace-1",
		});
		render(<RPRegistrationAdoptionDetailPage />);

		fireEvent.input(screen.getByLabelText("Partner workspace"), {
			target: { value: "workspace-1" },
		});
		fireEvent.input(screen.getByLabelText("Application information"), {
			target: { value: "application-information-1" },
		});
		fireEvent.input(screen.getByLabelText("CanadaLogin environment"), {
			target: { value: "production" },
		});
		fireEvent.click(
			screen.getByRole("button", { name: "Link registration to workspace" })
		);

		await waitFor(() =>
			expect(
				screen.getByRole("heading", { name: "Registration linked" })
			).toBeTruthy()
		);
		const successHeading = screen.getByRole("heading", {
			name: "Registration linked",
		});
		expect(successHeading.parentElement?.parentElement).toBe(
			document.activeElement
		);
		expect(linkToWorkspaceMock).toHaveBeenCalledWith("rp-application-1", {
			applicationInformationUuid: "application-information-1",
			canadaLoginEnvironment: "production",
			workspaceUuid: "workspace-1",
		});
		expect(screen.getByRole("link", { name: "View application" })).toBeTruthy();
		expect(screen.getByText("Partner environment: Not provided")).toBeTruthy();
		expect(screen.getByRole("link", { name: "View workspace" })).toBeTruthy();
	});

	it("shows the stable conflict state", async () => {
		linkToWorkspaceMock.mockRejectedValue(
			new ConflictRequestError({
				code: "rp_application_already_linked",
				detail: "Already linked",
			})
		);
		render(<RPRegistrationAdoptionDetailPage />);
		fireEvent.input(screen.getByLabelText("Partner workspace"), {
			target: { value: "workspace-1" },
		});
		fireEvent.input(screen.getByLabelText("Application information"), {
			target: { value: "application-information-1" },
		});
		fireEvent.input(screen.getByLabelText("CanadaLogin environment"), {
			target: { value: "production" },
		});
		fireEvent.click(
			screen.getByRole("button", { name: "Link registration to workspace" })
		);

		await waitFor(() =>
			expect(
				screen.getByRole("heading", { name: "Registration already linked" })
			).toBeTruthy()
		);
	});

	it("shows a retryable provider-unavailable state", () => {
		vi.mocked(useRPRegistrationAdoptionPreview).mockReturnValue({
			error: new ServerRequestError({
				detail: "Safe unavailable",
				status: 503,
			}),
			isLoading: false,
			preview: null,
			refetch: refetchMock,
		});
		render(<RPRegistrationAdoptionDetailPage />);

		expect(
			screen.getByRole("heading", {
				name: "IBM registration details unavailable",
			})
		).toBeTruthy();
		fireEvent.click(screen.getByRole("button", { name: "Try again" }));
		expect(refetchMock).toHaveBeenCalled();
	});
});
