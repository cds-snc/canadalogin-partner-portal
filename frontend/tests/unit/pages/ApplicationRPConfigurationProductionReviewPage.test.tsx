import {
	createElement,
	type PropsWithChildren,
	type ReactElement,
} from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useApplicationRPConfiguration } from "@/features/workspaces/hooks/use-application-rp-configurations";
import {
	useApplicationRPConfigurationProductionReview,
	useApplicationRPConfigurationProductionReviewActions,
} from "@/features/workspaces/hooks/use-application-rp-configuration-production-review";
import { ApplicationRPConfigurationProductionReviewPage } from "@/features/workspaces/pages/ApplicationRPConfigurationProductionReviewPage";
import { HttpRequestError } from "@/fetch";
import { useSession } from "@/hooks";

const requestReviewMock = vi.fn(() => Promise.resolve({} as never));
const reviewMock = vi.fn(() => Promise.resolve({} as never));
const refetchMock = vi.fn(() => Promise.resolve());
let resolvedLanguage = "en";

vi.mock("@tanstack/react-router", () => ({
	useParams: () => ({
		applicationInformationUuid: "application-uuid-1",
		rpConfigurationUuid: "rp-uuid-1",
		workspaceUuid: "workspace-uuid-1",
	}),
}));

vi.mock("react-i18next", () => ({
	useTranslation: () => ({
		i18n: { resolvedLanguage },
		t: (key: string): string =>
			({
				"workspaces.productionReviewStatusApproved": "Approved",
				"workspaces.productionReviewStatusPending": "Pending",
				"workspaces.productionReviewStatusRejected": "Rejected",
				"workspaces.productionReviewReconciliationRequired":
					"Historical review requires reconciliation",
				"workspaces.productionReviewReconciliationBody":
					"This historical review cannot be changed or replaced until an approved reconciliation preserves its earlier record and audit history.",
				"workspaces.rpConfigurationNameLabel": "RP configuration",
				"workspaces.rpConfigurationsApplicationLabel": "Application",
				"workspaces.rpProductionReviewBack": "Back to RP configuration",
				"workspaces.rpProductionReviewChecklistAction":
					"Open checklist and evidence",
				"workspaces.rpProductionReviewChecklistBody":
					"Missing inputs do not create a review request or block this action.",
				"workspaces.rpProductionReviewChecklistTitle":
					"Checklist and CATS context",
				"workspaces.rpProductionReviewContextTitle": "Production target",
				"workspaces.rpProductionReviewDecisionLabel": "Review outcome",
				"workspaces.rpProductionReviewDecisionTitle": "Record CL Admin review",
				"workspaces.rpProductionReviewNotRequested": "Not requested",
				"workspaces.rpProductionReviewRecordAction": "Record review outcome",
				"workspaces.rpProductionReviewReferenceLabel":
					"External review reference",
				"workspaces.rpProductionReviewReferenceRequired":
					"Enter an external review reference.",
				"workspaces.rpProductionReviewRequestAction":
					"Request Production review",
				"workspaces.rpProductionReviewRequestTitle":
					"Request Production review",
				"workspaces.rpProductionReviewRequestedSuccess":
					"Production review requested.",
				"workspaces.rpProductionReviewStatusLabel": "Review status",
				"workspaces.rpProductionReviewSummary": "Review this request.",
				"workspaces.rpProductionReviewTeamLabel": "Reviewing team",
				"workspaces.rpProductionReviewTerminalBody":
					"Approved and rejected outcomes are final.",
				"workspaces.rpProductionReviewTerminalTitle":
					"Production review is complete",
				"workspaces.rpProductionReviewTitle": "Production review",
				"workspaces.rpProductionReviewUpdateAction": "Update review reference",
			})[key] ?? key,
	}),
}));

vi.mock("@/components/ui", () => ({
	Button: ({
		children,
		disabled,
		type,
	}: PropsWithChildren<{
		disabled?: boolean;
		type: "button" | "link" | "reset" | "submit";
	}>): ReactElement => (
		<button disabled={disabled} type={type === "link" ? "button" : type}>
			{children}
		</button>
	),
	ErrorSummary: (): ReactElement => <div data-testid="error-summary" />,
	Grid: ({
		children,
		tag = "div",
	}: PropsWithChildren<{ tag?: string }>): ReactElement =>
		createElement(tag, undefined, children),
	Heading: ({
		children,
		tag = "h1",
	}: PropsWithChildren<{ tag?: string }>): ReactElement =>
		createElement(tag, undefined, children),
	Input: ({
		errorMessage,
		inputId,
		label,
		onInput,
		value,
	}: {
		errorMessage?: string;
		inputId: string;
		label: string;
		onInput?: (event: { target: EventTarget }) => void;
		value?: string;
	}): ReactElement => (
		<label htmlFor={inputId}>
			{label}
			<input
				id={inputId}
				value={value}
				onInput={(event) => onInput?.({ target: event.target })}
			/>
			{errorMessage ? <span role="alert">{errorMessage}</span> : null}
		</label>
	),
	Link: ({
		children,
		href,
	}: PropsWithChildren<{ href: string }>): ReactElement => (
		<a href={href}>{children}</a>
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
	Select: ({
		children,
		label,
		onInput,
		selectId,
		value,
	}: PropsWithChildren<{
		label: string;
		onInput?: (event: { target: EventTarget }) => void;
		selectId: string;
		value?: string;
	}>): ReactElement => (
		<label htmlFor={selectId}>
			{label}
			<select
				id={selectId}
				value={value}
				onInput={(event) => onInput?.({ target: event.target })}
			>
				{children}
			</select>
		</label>
	),
	Text: ({ children }: PropsWithChildren): ReactElement => <p>{children}</p>,
}));

vi.mock("@/hooks", () => ({ useSession: vi.fn() }));
vi.mock(
	"@/features/workspaces/hooks/use-application-rp-configurations",
	() => ({ useApplicationRPConfiguration: vi.fn() })
);
vi.mock(
	"@/features/workspaces/hooks/use-application-rp-configuration-production-review",
	() => ({
		useApplicationRPConfigurationProductionReview: vi.fn(),
		useApplicationRPConfigurationProductionReviewActions: vi.fn(),
	})
);

const configuration = {
	applicationInformationUuid: "application-uuid-1",
	canadaLoginEnvironment: "production" as const,
	configurationName: "Production A",
	partnerEnvironment: "Partner production",
	productionReviewStatus: null,
	registrationCompletedAt: "2026-08-25T12:00:00Z",
	serviceNameEn: "Benefits Portal",
	serviceNameFr: "Portail des prestations",
	uuid: "rp-uuid-1",
	workspaceName: "Benefits Workspace",
	workspaceUuid: "workspace-uuid-1",
};

const pendingReview = {
	applicationInformationUuid: "application-uuid-1",
	createdAt: "2026-08-25T12:00:00Z",
	decidedAt: null,
	externalReference: "CAB-123",
	requestedAt: "2026-08-25T12:00:00Z",
	reviewedAt: null,
	reviewedByTeam: null,
	reviewedByUserUuid: null,
	sourceRpConfigurationUuid: null,
	status: "pending" as const,
	targetConfigurationName: "Production A",
	targetEnvironment: "production" as const,
	targetRpConfigurationUuid: "rp-uuid-1",
	updatedAt: null,
};

describe("ApplicationRPConfigurationProductionReviewPage", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		resolvedLanguage = "en";
		vi.mocked(useApplicationRPConfiguration).mockReturnValue({
			configuration,
			error: null,
			isLoading: false,
			refetch: refetchMock,
		});
		vi.mocked(
			useApplicationRPConfigurationProductionReviewActions
		).mockReturnValue({
			isRequesting: false,
			isReviewing: false,
			requestReview: requestReviewMock,
			review: reviewMock,
		});
	});

	it("requires a traceable external reference before a partner request", async () => {
		vi.mocked(useSession).mockReturnValue({
			currentUser: {
				authorizationContext: {
					globalRole: null,
					partnerAccess: [
						{ role: "rp_user_edit", workspaceUuid: "workspace-uuid-1" },
					],
				},
			},
		} as unknown as ReturnType<typeof useSession>);
		vi.mocked(useApplicationRPConfigurationProductionReview).mockReturnValue({
			error: null,
			isLoading: false,
			productionReview: null,
			refetch: refetchMock,
		});
		render(<ApplicationRPConfigurationProductionReviewPage />);
		expect(screen.getByText("Benefits Portal")).toBeTruthy();
		expect(
			screen.getByText(
				"Missing inputs do not create a review request or block this action."
			)
		).toBeTruthy();
		expect(
			screen
				.getByRole("link", { name: "Open checklist and evidence" })
				.getAttribute("href")
		).toBe(
			"/workspaces/workspace-uuid-1/applications/application-uuid-1/checklist-and-evidence"
		);

		fireEvent.click(
			screen.getByRole("button", { name: "Request Production review" })
		);
		expect(screen.getByRole("alert").textContent).toBe(
			"Enter an external review reference."
		);
		expect(requestReviewMock).not.toHaveBeenCalled();

		fireEvent.input(screen.getByLabelText(/^External review reference/), {
			target: { value: "CAB-123" },
		});
		fireEvent.click(
			screen.getByRole("button", { name: "Request Production review" })
		);
		await waitFor(() =>
			expect(requestReviewMock).toHaveBeenCalledWith(
				"workspace-uuid-1",
				"application-uuid-1",
				"rp-uuid-1",
				{ externalReference: "CAB-123" }
			)
		);
	});

	it("lets a partner update only pending request metadata", async () => {
		vi.mocked(useSession).mockReturnValue({
			currentUser: {
				authorizationContext: {
					globalRole: null,
					partnerAccess: [
						{ role: "rp_user_edit", workspaceUuid: "workspace-uuid-1" },
					],
				},
			},
		} as unknown as ReturnType<typeof useSession>);
		vi.mocked(useApplicationRPConfigurationProductionReview).mockReturnValue({
			error: null,
			isLoading: false,
			productionReview: pendingReview,
			refetch: refetchMock,
		});
		const { rerender } = render(
			<ApplicationRPConfigurationProductionReviewPage />
		);
		fireEvent.input(screen.getByLabelText("External review reference"), {
			target: { value: "CAB-456" },
		});
		fireEvent.click(
			screen.getByRole("button", { name: "Update review reference" })
		);
		await waitFor(() =>
			expect(requestReviewMock).toHaveBeenCalledWith(
				"workspace-uuid-1",
				"application-uuid-1",
				"rp-uuid-1",
				{ externalReference: "CAB-456" }
			)
		);

		vi.mocked(useApplicationRPConfigurationProductionReview).mockReturnValue({
			error: null,
			isLoading: false,
			productionReview: {
				...pendingReview,
				decidedAt: "2026-08-25T13:00:00Z",
				status: "rejected",
			},
			refetch: refetchMock,
		});
		rerender(<ApplicationRPConfigurationProductionReviewPage />);
		expect(
			screen.queryByRole("button", { name: "Update review reference" })
		).toBeNull();
	});

	it("lets CL Admin decide only a pending request and hides terminal forms", async () => {
		resolvedLanguage = "fr";
		vi.mocked(useSession).mockReturnValue({
			currentUser: {
				authorizationContext: { globalRole: "cl_admin", partnerAccess: [] },
			},
		} as unknown as ReturnType<typeof useSession>);
		vi.mocked(useApplicationRPConfigurationProductionReview).mockReturnValue({
			error: null,
			isLoading: false,
			productionReview: pendingReview,
			refetch: refetchMock,
		});
		const { rerender } = render(
			<ApplicationRPConfigurationProductionReviewPage />
		);
		expect(screen.getByText("Portail des prestations")).toBeTruthy();
		expect(
			screen.getByRole("link", { name: "Open checklist and evidence" })
		).toBeTruthy();
		await waitFor(() =>
			expect(
				(screen.getByLabelText("External review reference") as HTMLInputElement)
					.value
			).toBe("CAB-123")
		);
		fireEvent.input(screen.getByLabelText("Review outcome"), {
			target: { value: "approved" },
		});
		fireEvent.click(
			screen.getByRole("button", { name: "Record review outcome" })
		);
		await waitFor(() =>
			expect(reviewMock).toHaveBeenCalledWith(
				"workspace-uuid-1",
				"application-uuid-1",
				"rp-uuid-1",
				{ externalReference: "CAB-123", status: "approved" }
			)
		);

		vi.mocked(useApplicationRPConfigurationProductionReview).mockReturnValue({
			error: null,
			isLoading: false,
			productionReview: {
				...pendingReview,
				decidedAt: "2026-08-25T13:00:00Z",
				status: "approved",
			},
			refetch: refetchMock,
		});
		rerender(<ApplicationRPConfigurationProductionReviewPage />);
		expect(
			screen.getByRole("heading", {
				name: "Production review is complete",
			})
		).toBeTruthy();
		expect(
			screen.queryByRole("button", { name: "Record review outcome" })
		).toBeNull();
		expect(
			screen.queryByRole("button", { name: "Update review reference" })
		).toBeNull();
	});

	it("gives Read Only the review status and checklist context without forms", () => {
		vi.mocked(useSession).mockReturnValue({
			currentUser: {
				authorizationContext: {
					globalRole: null,
					partnerAccess: [
						{ role: "read_only", workspaceUuid: "workspace-uuid-1" },
					],
				},
			},
		} as unknown as ReturnType<typeof useSession>);
		vi.mocked(useApplicationRPConfigurationProductionReview).mockReturnValue({
			error: null,
			isLoading: false,
			productionReview: pendingReview,
			refetch: refetchMock,
		});

		render(<ApplicationRPConfigurationProductionReviewPage />);

		expect(screen.getByText("Pending")).toBeTruthy();
		expect(
			screen.getByRole("link", { name: "Open checklist and evidence" })
		).toBeTruthy();
		expect(
			screen.queryByRole("button", { name: "Request Production review" })
		).toBeNull();
		expect(
			screen.queryByRole("button", { name: "Record review outcome" })
		).toBeNull();
		expect(screen.queryByLabelText("External review reference")).toBeNull();
	});

	it("does not misrepresent an ambiguous historical review as not requested", () => {
		vi.mocked(useSession).mockReturnValue({
			currentUser: {
				authorizationContext: {
					globalRole: null,
					partnerAccess: [
						{ role: "read_only", workspaceUuid: "workspace-uuid-1" },
					],
				},
			},
		} as unknown as ReturnType<typeof useSession>);
		vi.mocked(useApplicationRPConfiguration).mockReturnValue({
			configuration: {
				...configuration,
				productionReviewReconciliationRequired: true,
			},
			error: null,
			isLoading: false,
			refetch: refetchMock,
		});
		vi.mocked(useApplicationRPConfigurationProductionReview).mockReturnValue({
			error: new HttpRequestError({
				detail: "Historical Production-review record requires reconciliation",
				status: 400,
			}),
			isLoading: false,
			productionReview: null,
			refetch: refetchMock,
		});

		render(<ApplicationRPConfigurationProductionReviewPage />);

		expect(
			screen.getByRole("heading", {
				name: "Historical review requires reconciliation",
			})
		).toBeTruthy();
		expect(
			screen.getByText(
				"This historical review cannot be changed or replaced until an approved reconciliation preserves its earlier record and audit history."
			)
		).toBeTruthy();
		expect(
			screen.queryByText(
				"Historical Production-review record requires reconciliation"
			)
		).toBeNull();
		expect(screen.queryByText("Not requested")).toBeNull();
		expect(
			screen.queryByRole("button", { name: "Request Production review" })
		).toBeNull();
		expect(
			screen.queryByRole("button", { name: "Record review outcome" })
		).toBeNull();
	});
});
