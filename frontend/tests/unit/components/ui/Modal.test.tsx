import type { PropsWithChildren, ReactElement } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

vi.mock("@gcds-core/components-react", () => ({
	GcdsButton: ({ children, disabled, onGcdsClick, type }: PropsWithChildren<{ disabled?: boolean; onGcdsClick?: () => void; type?: "button" | "submit" | "reset" | "link" }>): ReactElement => (
		<button disabled={disabled} onClick={onGcdsClick} type={type === "link" ? "button" : (type ?? "button")}>
			{children}
		</button>
	),
	GcdsHeading: ({ children }: PropsWithChildren): ReactElement => <h2>{children}</h2>,
	GcdsText: ({ children }: PropsWithChildren): ReactElement => <p>{children}</p>,
}));

describe("Modal", () => {
	it("renders content when open and calls onClose", () => {
		const handleClose = vi.fn();

		render(
			<Modal footer={<button type="button">Save</button>} isOpen onClose={handleClose} title="Edit role">
				<p>Role form fields</p>
			</Modal>,
		);

		expect(screen.getByRole("dialog", { name: /edit role/i })).toBeTruthy();
		expect(screen.getByText(/role form fields/i)).toBeTruthy();
		expect(document.querySelector(".government-modal__backdrop--visible")).toBeTruthy();
		expect(document.querySelector(".government-modal__panel--animated")).toBeTruthy();

		fireEvent.click(screen.getByRole("button", { name: /close/i }));

		expect(handleClose).toHaveBeenCalledTimes(1);
	});

	it("does not render content when closed", () => {
		render(
			<Modal isOpen={false} onClose={vi.fn()} title="Hidden modal">
				<p>Hidden content</p>
			</Modal>,
		);

		expect(screen.queryByRole("dialog", { name: /hidden modal/i })).toBeNull();
	});
});

describe("ConfirmDialog", () => {
	it("calls onConfirm for destructive action", () => {
		const handleClose = vi.fn();
		const handleConfirm = vi.fn();

		render(
			<ConfirmDialog
				cancelLabel="Cancel"
				confirmLabel="Delete role"
				description="This action cannot be undone."
				isOpen
				onClose={handleClose}
				onConfirm={handleConfirm}
				title="Delete role?"
			/>,
		);

		fireEvent.click(screen.getByRole("button", { name: /delete role/i }));

		expect(handleConfirm).toHaveBeenCalledTimes(1);
		expect(handleClose).not.toHaveBeenCalled();
	});
});