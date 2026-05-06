import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { FunctionComponent } from "@/common/types";
import { getRequestErrorMessage } from "@/fetch";
import { Button, Modal } from "@/components/ui";
import { useToast } from "@/components/ui/Toast";
import { rotateRPApplicationClientSecret } from "@/fetch/workspaces";

type WorkspaceClientSecretRegenerateModalProps = {
	applicationUuid: string | null;
	isOpen: boolean;
	workspaceUuid: string;
	onClose: () => void;
	onRotated: () => Promise<void> | void;
};

export const WorkspaceClientSecretRegenerateModal = (
	props: WorkspaceClientSecretRegenerateModalProps
): FunctionComponent => {
	const { applicationUuid, isOpen, onClose, onRotated, workspaceUuid } = props;
	const { t } = useTranslation() as unknown as {
		t: (key: string | Array<string>, opts?: Record<string, unknown>) => string;
	};
	const toast = useToast();
	const [isSubmitting, setIsSubmitting] = useState(false);

	const handleRegenerate = async (): Promise<void> => {
		if (!applicationUuid) {
			return;
		}

		setIsSubmitting(true);
		try {
			await rotateRPApplicationClientSecret(workspaceUuid, applicationUuid, {
				deleteRotatedSecrets: false,
				description: "",
				rotatedSecretExpiredAt: 0,
			});
			toast.success(t("workspaces.applicationRotateSecretSuccess"));
			await onRotated();
			onClose();
		} catch (error) {
			console.error(error);
			toast.error(getRequestErrorMessage(error, t("errors.unknown")));
		} finally {
			setIsSubmitting(false);
		}
	};

	if (!isOpen) {
		return null;
	}

	return (
		<Modal
			description={t("workspaces.applicationClientRotateOptionRegenerateHelp")}
			isOpen={isOpen}
			title={t("workspaces.applicationClientRotateConfirmTitle")}
			onClose={onClose}
		>
			<div className="flex flex-col gap-4">
				<p className="text-sm text-slate-700">
					{t("workspaces.applicationClientRotateOptionRegenerateHelp")}
				</p>
				<div className="flex justify-end pt-2">
					<Button
						disabled={isSubmitting}
						type="button"
						onGcdsClick={() => {
							void handleRegenerate();
						}}
					>
						{isSubmitting
							? t("common.saving")
							: t("workspaces.applicationClientRotateOptionRegenerate")}
					</Button>
				</div>
			</div>
		</Modal>
	);
};
