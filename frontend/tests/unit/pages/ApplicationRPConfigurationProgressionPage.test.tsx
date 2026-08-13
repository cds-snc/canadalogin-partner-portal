import {
	createElement,
	type PropsWithChildren,
	type ReactElement,
} from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApplicationRPConfigurationProgressionPage } from "@/features/workspaces/pages/ApplicationRPConfigurationProgressionPage";
import {
	useApplicationRPConfiguration,
	useApplicationRPConfigurationProgressionActions,
} from "@/features/workspaces/hooks/use-application-rp-configurations";

const navigateMock = vi.fn(() => Promise.resolve());
const createProgressionMock = vi.fn(() =>
	Promise.resolve({
		applicationInformationUuid: "application-1",
		promotionStatus: "review_tracked",
		selfServe: false,
		sourceConfigurationName: "Partner staging A",
		sourcePartnerEnvironment: "Partner staging",
		sourceEnvironment: "staging" as const,
		sourceRpConfigurationUuid: "source-1",
		targetConfigurationName: "Partner production A",
		targetPartnerEnvironment: "Partner production",
		targetEnvironment: "production" as const,
		targetRegistrationDraftVersion: 1,
		targetRegistrationLastCompletedStep: "basics" as const,
		targetRpConfigurationUuid: "target-1",
		workspaceUuid: "workspace-1",
	})
);

vi.mock("react-i18next", () => ({
	useTranslation: () => ({ t: (key: string): string => key }),
}));

vi.mock("@tanstack/react-router", () => ({
	useNavigate: () => navigateMock,
	useParams: () => ({
		applicationInformationUuid: "application-1",
		rpConfigurationUuid: "source-1",
		workspaceUuid: "workspace-1",
	}),
}));

vi.mock("@/components/ui", () => ({
	Button: ({
		children,
		href,
		type,
	}: PropsWithChildren<{ href?: string; type?: string }>): ReactElement =>
		type === "link" ? (
			<a href={href}>{children}</a>
		) : (
			<button type={type === "submit" ? "submit" : "button"}>{children}</button>
		),
	ErrorSummary: (): ReactElement => <div role="alert">Check your answer</div>,
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
		label,
		onInput,
		value,
	}: {
		label: string;
		onInput: (event: { target: HTMLInputElement }) => void;
		value: string;
	}): ReactElement => (
		<label>
			{label}
			<input
				value={value}
				onChange={(event) => onInput({ target: event.target })}
			/>
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
		useApplicationRPConfigurationProgressionActions: vi.fn(),
	})
);

describe("ApplicationRPConfigurationProgressionPage", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(useApplicationRPConfiguration).mockReturnValue({
			configuration: {
				applicationInformationUuid: "application-1",
				canadaLoginEnvironment: "staging",
				configurationName: "Partner staging A",
				partnerEnvironment: "Partner staging",
				onboardingState: "approved",
				promotionStatus: null,
				role: "rp_admin",
				serviceNameEn: "Benefits Portal",
				serviceNameFr: "Portail des prestations",
				uuid: "source-1",
				workspaceName: "Benefits Workspace",
				workspaceUuid: "workspace-1",
			},
			error: null,
			isLoading: false,
			refetch: vi.fn(async () => null),
		});
		vi.mocked(useApplicationRPConfigurationProgressionActions).mockReturnValue({
			createProgression: createProgressionMock,
			isCreating: false,
		});
	});

	it("creates a named Production target from the displayed source", async () => {
		render(<ApplicationRPConfigurationProgressionPage />);

		expect(screen.getByText("Partner staging A")).toBeTruthy();
		expect(screen.getByText("Partner staging")).toBeTruthy();
		expect(screen.getByText("workspaces.rpProgressionReviewBody")).toBeTruthy();
		fireEvent.change(
			screen.getByLabelText("workspaces.rpProgressionNameLabel"),
			{ target: { value: "Partner production A" } }
		);
		fireEvent.change(
			screen.getByLabelText("workspaces.rpProgressionPartnerEnvironmentLabel"),
			{ target: { value: "Partner production" } }
		);
		fireEvent.click(
			screen.getByRole("button", {
				name: "workspaces.rpProgressionCreateAction",
			})
		);

		await waitFor(() => expect(createProgressionMock).toHaveBeenCalled());
		expect(createProgressionMock.mock.calls[0]?.slice(0, 4)).toEqual([
			"workspace-1",
			"application-1",
			"source-1",
			{
				targetConfigurationName: "Partner production A",
				targetPartnerEnvironment: "Partner production",
				targetEnvironment: "production",
			},
		]);
		await waitFor(() =>
			expect(navigateMock).toHaveBeenCalledWith({
				href: "/workspaces/workspace-1/applications/application-1/rp-configurations/target-1/registration/endpoints",
				replace: true,
			})
		);
	});
});
