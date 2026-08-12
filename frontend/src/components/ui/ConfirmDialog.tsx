import type { ReactElement } from "react";
import Button from "./Button";
import Modal from "./Modal";
import Notice from "./Notice";

export type ConfirmDialogProps = {
	cancelLabel?: string;
	confirmLabel?: string;
	description: string;
	errorMessage?: string | null;
	errorTitle?: string;
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
	errorMessage,
	errorTitle,
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
	>
		{errorMessage ? (
			<Notice
				noticeRole="danger"
				noticeTitle={errorTitle ?? errorMessage}
				noticeTitleTag="h3"
			>
				{errorTitle ? <p>{errorMessage}</p> : null}
			</Notice>
		) : null}
	</Modal>
);

export default ConfirmDialog;
