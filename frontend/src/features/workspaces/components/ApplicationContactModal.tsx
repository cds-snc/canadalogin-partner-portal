import { useTranslation } from "react-i18next";
import type { FunctionComponent } from "@/common/types";
import { Modal } from "@/components/ui";
import { ApplicationContactForm } from "@/features/workspaces/components/ApplicationContactForm";
import type { ApplicationContactRead } from "@/fetch/application-info";

type ApplicationContactModalProps = {
	applicationContact?: ApplicationContactRead | null;
	applicationInfoUuid: string;
	isOpen: boolean;
	mode?: "create" | "edit";
	onClose: () => void;
	onSaved: () => Promise<void> | void;
	workspaceUuid: string;
};

export const ApplicationContactModal = ({
	applicationContact,
	applicationInfoUuid,
	isOpen,
	mode = "create",
	onClose,
	onSaved,
	workspaceUuid,
}: ApplicationContactModalProps): FunctionComponent => {
	const { t } = useTranslation() as unknown as { t: (key: string) => string };

	const isEditMode = mode === "edit" && !!applicationContact;

	if (!isOpen) {
		return null;
	}

	return (
		<Modal
			isOpen={isOpen}
			title={t(
				isEditMode
					? "workspaces.appInfoEditContactModalTitle"
					: "workspaces.appInfoContactModalTitle"
			)}
			onClose={onClose}
		>
			<ApplicationContactForm
				applicationContact={applicationContact}
				applicationInfoUuid={applicationInfoUuid}
				mode={mode}
				workspaceUuid={workspaceUuid}
				onCancel={onClose}
				onSaved={onSaved}
			/>
		</Modal>
	);
};