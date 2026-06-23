import type { ReactElement } from "react";
import Button from "./Button";
import Modal from "./Modal";

export type ConfirmDialogProps = {
	cancelLabel?: string;
	confirmLabel?: string;
	description: string;
	isOpen: boolean;
	isPending?: boolean;
	onClose: () => void;
	onConfirm: () => void;
	title: string;
};

const ConfirmDialog = ({
	cancelLabel = "Cancel",
	confirmLabel = "Confirm",
	description,
	isOpen,
	isPending = false,
	onClose,
	onConfirm,
	title,
}: ConfirmDialogProps): ReactElement => (
	<Modal
		description={description}
		isOpen={isOpen}
		size="narrow"
		title={title}
		footer={
			<>
				<Button
					buttonRole="secondary"
					disabled={isPending}
					type="button"
					onGcdsClick={onClose}
				>
					{cancelLabel}
				</Button>
				<Button
					buttonRole="danger"
					disabled={isPending}
					type="button"
					onGcdsClick={onConfirm}
				>
					{confirmLabel}
				</Button>
			</>
		}
		onClose={onClose}
	/>
);

export default ConfirmDialog;
