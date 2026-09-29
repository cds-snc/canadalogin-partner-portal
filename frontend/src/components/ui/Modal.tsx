import type { PropsWithChildren, ReactNode, ReactElement } from "react";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import "./Modal.css";

export type ModalProps = PropsWithChildren<{
	description?: string;
	footer?: ReactNode;
	isOpen: boolean;
	onClose: () => void;
	showCloseButton?: boolean;
	size?: "narrow" | "regular" | "wide" | "full-width";
	title: string;
	titleSize?: "regular" | "small" | "large";
}>;

const Modal = ({
	children,
	description,
	footer,
	isOpen,
	onClose,
	showCloseButton = true,
	size = "regular",
	title,
	titleSize = "regular",
}: ModalProps): ReactElement | null => {
	if (!isOpen) {
		return null;
	}

	return (
		<Dialog className="government-modal" open={isOpen} onClose={onClose}>
			<div
				aria-hidden="true"
				className="government-modal__backdrop government-modal__backdrop--visible"
			/>
			<DialogPanel
				className={`government-modal__panel government-modal__panel--${size} government-modal__panel--animated`}
			>
				<div className="government-modal__header">
					<div>
						<DialogTitle
							as="h2"
							className={`government-modal__title government-modal__title--${titleSize}`}
						>
							{title}
						</DialogTitle>
						{description ? (
							<p
								className="government-modal__description"
								style={{ whiteSpace: "pre-line" }}
							>
								{description}
							</p>
						) : null}
					</div>
					{showCloseButton ? (
						<button
							aria-label="Close"
							className="government-modal__close"
							type="button"
							onClick={onClose}
						>
							Close
						</button>
					) : null}
				</div>
				<div className="government-modal__body">{children}</div>
				{footer ? (
					<div className="government-modal__footer">{footer}</div>
				) : null}
			</DialogPanel>
		</Dialog>
	);
};

export default Modal;
