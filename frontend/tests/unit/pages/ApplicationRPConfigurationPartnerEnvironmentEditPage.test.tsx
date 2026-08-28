import {
	createElement,
	type FormEventHandler,
	type PropsWithChildren,
	type ReactElement,
} from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApplicationRPConfigurationPartnerEnvironmentEditPage } from "@/features/workspaces/pages/ApplicationRPConfigurationPartnerEnvironmentEditPage";
import {
	useApplicationRPConfiguration,
	useApplicationRPConfigurationPartnerEnvironmentActions,
} from "@/features/workspaces/hooks/use-application-rp-configurations";

const navigate = vi.fn(async () => undefined);
const updatePartnerEnvironment = vi.fn();

vi.mock("react-i18next", () => ({
	useTranslation: () => ({
		t: (key: string): string => key,
	}),
}));

vi.mock("@tanstack/react-router", () => ({
	useNavigate: () => navigate,
	useParams: () => ({
		applicationInformationUuid: "application-information-uuid-1",
		rpConfigurationUuid: "rp-configuration-uuid-1",
		workspaceUuid: "workspace-uuid-1",
	}),
}));

vi.mock("@/components/ui", () => ({
	Button: ({
		children,
		disabled,
		href,
		type,
	}: PropsWithChildren<{
		disabled?: boolean;
		href?: string;
		type?: "link" | "submit";
	}>): ReactElement =>
		type === "link" ? (
			<a href={href}>{children}</a>
		) : (
			<button disabled={disabled} type="submit">
				{children}
			</button>
		),
	ErrorSummary: ({
		errorLinks,
		heading,
	}: {
		errorLinks?: Record<string, string>;
		heading?: string;
	}): ReactElement => (
		<section aria-label={heading}>
			{Object.entries(errorLinks ?? {}).map(([id, message]) => (
				<a href={`#${id}`} key={id}>
					{message}
				</a>
			))}
		</section>
	),
	Heading: ({
		children,
		tag = "h1",
	}: PropsWithChildren<{ tag?: string }>): ReactElement =>
		createElement(tag, undefined, children),
	Input: ({
		errorMessage,
		inputId,
		label,
		name,
		onInput,
		value,
	}: {
		errorMessage?: string;
		inputId: string;
		label: string;
		name: string;
		onInput?: FormEventHandler<HTMLInputElement>;
		value?: string;
	}): ReactElement => (
		<label htmlFor={inputId}>
			{label}
			{errorMessage ? <span>{errorMessage}</span> : null}
			<input id={inputId} name={name} value={value} onInput={onInput} />
		</label>
	),
	Link: ({
		children,
		href,
	}: PropsWithChildren<{ href: string }>): ReactElement => (
		<a href={href}>{children}</a>
	),
	Notice: ({ children }: PropsWithChildren): ReactElement => (
		<section>{children}</section>
	),
	Text: ({ children }: PropsWithChildren): ReactElement => <p>{children}</p>,
}));

vi.mock(
	"@/features/workspaces/hooks/use-application-rp-configurations",
	() => ({
		useApplicationRPConfiguration: vi.fn(),
		useApplicationRPConfigurationPartnerEnvironmentActions: vi.fn(),
	})
);

describe("ApplicationRPConfigurationPartnerEnvironmentEditPage", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(useApplicationRPConfiguration).mockReturnValue({
			configuration: {
				applicationInformationUuid: "application-information-uuid-1",
				canadaLoginEnvironment: "production",
				configurationName: "Partner production A",
				partnerEnvironment: "Partner production",
				productionReviewStatus: "approved",
				registrationCompletedAt: "2026-08-25T12:00:00Z",
				registrationLastCompletedStep: "encryption",
				resumeTaskPath: null,
				role: "rp_admin",
				serviceNameEn: "Benefits Portal",
				serviceNameFr: "Portail des prestations",
				uuid: "rp-configuration-uuid-1",
				workspaceName: "Benefits Workspace",
				workspaceUuid: "workspace-uuid-1",
			},
			error: null,
			isLoading: false,
			refetch: vi.fn(async () => null),
		});
		vi.mocked(
			useApplicationRPConfigurationPartnerEnvironmentActions
		).mockReturnValue({
			isUpdating: false,
			updatePartnerEnvironment,
		});
		updatePartnerEnvironment.mockResolvedValue({
			applicationInformationUuid: "application-information-uuid-1",
			partnerEnvironment: "Partner production blue",
			rpConfigurationUuid: "rp-configuration-uuid-1",
			updatedAt: "2026-08-13T15:00:00Z",
			workspaceUuid: "workspace-uuid-1",
		});
	});

	it("updates the focused metadata field in any lifecycle state", async () => {
		const user = userEvent.setup();
		render(<ApplicationRPConfigurationPartnerEnvironmentEditPage />);

		const input = screen.getByRole("textbox", {
			name: "workspaces.applicationsPartnerEnvironmentLabel",
		});
		await user.clear(input);
		await user.type(input, "Partner production blue");
		await user.click(
			screen.getByRole("button", {
				name: "workspaces.rpPartnerEnvironmentSaveAction",
			})
		);

		await waitFor(() => {
			expect(updatePartnerEnvironment).toHaveBeenCalledWith(
				"workspace-uuid-1",
				"application-information-uuid-1",
				"rp-configuration-uuid-1",
				{ partnerEnvironment: "Partner production blue" }
			);
		});
		expect(navigate).toHaveBeenCalledWith({
			href: "/workspaces/workspace-uuid-1/applications/application-information-uuid-1/rp-configurations/rp-configuration-uuid-1",
			replace: true,
		});
	});

	it("shows matching summary and inline required messages", async () => {
		const user = userEvent.setup();
		render(<ApplicationRPConfigurationPartnerEnvironmentEditPage />);
		await user.clear(
			screen.getByRole("textbox", {
				name: "workspaces.applicationsPartnerEnvironmentLabel",
			})
		);
		await user.click(
			screen.getByRole("button", {
				name: "workspaces.rpPartnerEnvironmentSaveAction",
			})
		);

		expect(
			screen.getAllByText("workspaces.rpPartnerEnvironmentRequired")
		).toHaveLength(2);
		expect(updatePartnerEnvironment).not.toHaveBeenCalled();
	});
});
