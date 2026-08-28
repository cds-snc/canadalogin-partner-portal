import type { PropsWithChildren, ReactElement } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { InviteUserPage } from "@/features/users/pages/InviteUserPage";
import { useInviteUser } from "@/features/users/hooks/use-invite-user";
import { useWorkspaces } from "@/features/workspaces/hooks/use-workspaces";

const invite = vi.hoisted(() => vi.fn());
const navigate = vi.hoisted(() => vi.fn());
const writeText = vi.hoisted(() => vi.fn());

vi.mock("@tanstack/react-router", () => ({
	useNavigate: () => navigate,
}));

vi.mock("react-i18next", () => ({
	useTranslation: () => ({
		t: (key: string): string =>
			({
				"authorization.roles.readOnly": "Read Only",
				"authorization.roles.rpAdmin": "RP Admin",
				"authorization.roles.rpUserEdit": "RP User (Edit)",
				"invitations.manualDelivery.copiedConfirmation":
					"Invitation link copied.",
				"invitations.manualDelivery.copyAction": "Copy invitation link",
				"invitations.manualDelivery.copyError":
					"The link could not be copied automatically.",
				"invitations.manualDelivery.deliveryBody":
					"The portal does not send invitation email.",
				"invitations.manualDelivery.linkLabel": "Invitation link",
				"invitations.manualDelivery.singleViewBody":
					"This link is shown only in this result and cannot be retrieved after you leave.",
				"users.cancelAction": "Cancel",
				"users.emailLabel": "Email",
				"users.inviteAction": "Invite user",
				"users.inviteExpiryFourteenDays": "14 days",
				"users.inviteExpiryLabel": "Invitation expiry",
				"users.inviteExpirySevenDays": "7 days",
				"users.inviteExpiryThirtyDays": "30 days",
				"users.inviteIneligibleBody": "This account cannot receive access.",
				"users.inviteIneligibleTitle": "Invitation unavailable",
				"users.inviteSuccessBody":
					"Share this link using an approved communication channel.",
				"users.inviteSuccessTitle": "Invitation created",
				"users.inviteSummary":
					"Invite a person to a workspace and assign their first role.",
				"users.inviteTitle": "Invite user",
				"users.inviteWorkspaceLabel": "Workspace",
				"users.inviteWorkspacePlaceholder": "Select a workspace",
				"users.roleLabel": "Role",
			})[key] ?? key,
	}),
}));

vi.mock("@/components/ui", () => ({
	Button: ({
		children,
		disabled,
		href,
		onGcdsClick,
		type,
	}: PropsWithChildren<{
		disabled?: boolean;
		href?: string;
		onGcdsClick?: () => void;
		type?: string;
	}>): ReactElement =>
		type === "link" ? (
			<a href={href}>{children}</a>
		) : (
			<button disabled={disabled} onClick={onGcdsClick} type="button">
				{children}
			</button>
		),
	Heading: ({
		children,
		tag,
	}: PropsWithChildren<{ tag: string }>): ReactElement =>
		tag === "h1" ? <h1>{children}</h1> : <h2>{children}</h2>,
	Input: ({
		inputId,
		label,
		onInput,
		type,
		value,
	}: {
		inputId: string;
		label: string;
		onInput: (event: React.FormEvent<HTMLInputElement>) => void;
		type: string;
		value: string;
	}): ReactElement => (
		<label htmlFor={inputId}>
			{label}
			<input id={inputId} onInput={onInput} type={type} value={value} />
		</label>
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
		onInput: (event: React.FormEvent<HTMLSelectElement>) => void;
		selectId: string;
		value: string;
	}>): ReactElement => (
		<label htmlFor={selectId}>
			{label}
			<select id={selectId} onInput={onInput} value={value}>
				{children}
			</select>
		</label>
	),
	Text: ({ children }: PropsWithChildren): ReactElement => <p>{children}</p>,
}));

vi.mock("@/features/users/hooks/use-invite-user", () => ({
	useInviteUser: vi.fn(),
}));
vi.mock("@/features/workspaces/hooks/use-workspaces", () => ({
	useWorkspaces: vi.fn(),
}));

const renderPage = (): void => {
	vi.mocked(useInviteUser).mockReturnValue({
		error: null,
		invite,
		isInviting: false,
	});
	vi.mocked(useWorkspaces).mockReturnValue({
		error: null,
		isLoading: false,
		workspaces: [{ name: "Benefits", uuid: "workspace-uuid-1" }],
	} as never);
	render(<InviteUserPage />);
};

const completeForm = (): void => {
	fireEvent.input(screen.getByLabelText("Email"), {
		target: { value: "person@example.test" },
	});
	fireEvent.input(screen.getByLabelText("Workspace"), {
		target: { value: "workspace-uuid-1" },
	});
};

describe("InviteUserPage", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		writeText.mockResolvedValue(undefined);
		Object.defineProperty(globalThis.navigator, "clipboard", {
			configurable: true,
			value: { writeText },
		});
	});

	it("creates a workspace invitation with the selected role", async () => {
		invite.mockResolvedValue({
			acceptanceUrl: "https://portal.example.test/invitations/token",
			kind: "invitation_created",
		});
		renderPage();
		completeForm();
		fireEvent.input(screen.getByLabelText("Role"), {
			target: { value: "rp_admin" },
		});

		fireEvent.click(screen.getByRole("button", { name: "Invite user" }));

		await waitFor(() =>
			expect(invite).toHaveBeenCalledWith({
				invitedEmail: "person@example.test",
				inviteExpiresAt: expect.any(String),
				role: "rp_admin",
				workspaceUuid: "workspace-uuid-1",
			})
		);
		expect(
			await screen.findByRole("heading", { name: "Invitation created" })
		).toBeTruthy();
		expect(
			screen.getByText("https://portal.example.test/invitations/token")
		).toBeTruthy();
		expect(
			screen.getByText("The portal does not send invitation email.")
		).toBeTruthy();
		expect(
			screen.getByText(
				"This link is shown only in this result and cannot be retrieved after you leave."
			)
		).toBeTruthy();

		fireEvent.click(
			screen.getByRole("button", { name: "Copy invitation link" })
		);
		await waitFor(() =>
			expect(writeText).toHaveBeenCalledWith(
				"https://portal.example.test/invitations/token"
			)
		);
		expect(await screen.findByText("Invitation link copied.")).toBeTruthy();
	});

	it("keeps the one-time link visible for manual copy when clipboard access fails", async () => {
		writeText.mockRejectedValueOnce(new Error("Clipboard unavailable"));
		invite.mockResolvedValue({
			acceptanceUrl: "https://portal.example.test/invitations/token",
			kind: "invitation_created",
		});
		renderPage();
		completeForm();

		fireEvent.click(screen.getByRole("button", { name: "Invite user" }));
		fireEvent.click(
			await screen.findByRole("button", { name: "Copy invitation link" })
		);

		expect(
			await screen.findByText("The link could not be copied automatically.")
		).toBeTruthy();
		expect(
			screen.getByText("https://portal.example.test/invitations/token")
		).toBeTruthy();
	});

	it("redirects an existing identity to access management", async () => {
		invite.mockResolvedValue({
			kind: "existing_identity",
			userUuid: "existing-user-uuid",
		});
		renderPage();
		completeForm();

		fireEvent.click(screen.getByRole("button", { name: "Invite user" }));

		await waitFor(() =>
			expect(navigate).toHaveBeenCalledWith({
				params: { userUuid: "existing-user-uuid" },
				to: "/users/$userUuid",
			})
		);
		expect(invite).toHaveBeenCalledTimes(1);
	});

	it("does not create access for an ineligible identity", async () => {
		invite.mockResolvedValue({ kind: "ineligible_identity" });
		renderPage();
		completeForm();

		fireEvent.click(screen.getByRole("button", { name: "Invite user" }));

		expect(
			await screen.findByRole("heading", { name: "Invitation unavailable" })
		).toBeTruthy();
		expect(navigate).not.toHaveBeenCalled();
	});
});
