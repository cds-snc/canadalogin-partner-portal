import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import type { FunctionComponent } from "@/common/types";
import { Button, Modal } from "@/components/ui";
import { useToast } from "@/components/ui/Toast";
import {
	getRPApplicationClientCredentials,
	type RPApplicationRead,
	type RPApplicationClientCredentialsRead,
} from "@/fetch/workspaces";
import { getClientValue } from "./workspace-detail-utils";
import { WorkspaceClientSecretRegenerateModal } from "./WorkspaceClientSecretRegenerateModal";
import { WorkspaceClientSecretRotateModal } from "./WorkspaceClientSecretRotateModal";

type WorkspaceClientCredentialsModalProps = {
	application: RPApplicationRead | null;
	dateInputLang: "en" | "fr";
	isOpen: boolean;
	workspaceUuid: string;
	onClose: () => void;
};

export const WorkspaceClientCredentialsModal = (
	props: WorkspaceClientCredentialsModalProps
): FunctionComponent => {
	const { application, dateInputLang, isOpen, workspaceUuid, onClose } = props;
	const { t } = useTranslation() as unknown as {
		t: (key: string | Array<string>, opts?: Record<string, unknown>) => string;
	};
	const toast = useToast();
	const [
		isRegenerateClientSecretModalOpen,
		setIsRegenerateClientSecretModalOpen,
	] = useState(false);
	const [isRotateClientModalOpen, setIsRotateClientModalOpen] = useState(false);

	const {
		data: clientCredentials,
		isLoading: isClientCredentialsLoading,
		refetch: refetchClientCredentials,
	} = useQuery<RPApplicationClientCredentialsRead>({
		queryKey: [
			"workspace-client-credentials",
			workspaceUuid,
			application?.uuid,
		],
		queryFn: () =>
			application?.uuid
				? getRPApplicationClientCredentials(workspaceUuid, application.uuid)
				: Promise.reject(new Error("Missing application uuid")),
		enabled: isOpen && !!application?.uuid,
	});

	const closeClientModal = (): void => {
		setIsRegenerateClientSecretModalOpen(false);
		setIsRotateClientModalOpen(false);
		onClose();
	};

	const refreshClientCredentials = async (): Promise<void> => {
		await refetchClientCredentials();
	};

	const closeRegenerateClientSecretModal = (): void => {
		setIsRegenerateClientSecretModalOpen(false);
	};

	const closeRotateClientSecretModal = (): void => {
		setIsRotateClientModalOpen(false);
	};

	const handleCopyClientSecret = async (): Promise<void> => {
		const clientSecret = clientCredentials?.client_secret;
		if (!clientSecret) {
			return;
		}

		try {
			await globalThis.navigator.clipboard.writeText(clientSecret);
			toast.success(t("workspaces.applicationClientCopiedSuccess"));
		} catch (error) {
			console.error(error);
			toast.error(t("errors.unknown"));
		}
	};

	const handleCopyClientId = async (): Promise<void> => {
		const clientId = clientCredentials?.client_id;
		if (!clientId) {
			return;
		}

		try {
			await globalThis.navigator.clipboard.writeText(clientId);
			toast.success(t("workspaces.applicationClientIdCopiedSuccess"));
		} catch (error) {
			console.error(error);
			toast.error(t("errors.unknown"));
		}
	};

	if (!isOpen) {
		return null;
	}

	return (
		<>
			<Modal
				description={t("workspaces.applicationClientHelp")}
				isOpen={isOpen}
				size="wide"
				title={t("workspaces.applicationClientModalTitle")}
				onClose={closeClientModal}
			>
				<div className="flex flex-col gap-5">
					<div className="grid gap-4 md:grid-cols-2">
						<div className="rounded border border-slate-300 bg-slate-50 p-4">
							<p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
								{t("workspaces.applicationClientApplicationLabel")}
							</p>
							<p className="mt-2 text-base font-semibold text-slate-900">
								{application?.name ?? "-"}
							</p>
						</div>
						<div className="rounded border border-slate-300 bg-slate-50 p-4">
							<p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
								{t("workspaces.applicationClientApplicationIdLabel")}
							</p>
							<p className="mt-2 break-all font-mono text-sm text-slate-900">
								{application?.ibm_sv_application_id ?? "-"}
							</p>
						</div>
					</div>

					{isClientCredentialsLoading ? (
						<p>{t("workspaces.loadingApplications")}</p>
					) : (
						<>
							<div className="rounded border border-slate-300 bg-white shadow-sm">
								<div
									className="flex flex-col gap-2 border-b border-slate-200 px-4 py-3 md:flex-row md:items-center md:justify-between"
									data-testid="workspace-client-id-row"
								>
									<div className="min-w-0">
										<p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
											{t("workspaces.applicationClientIdLabel")}
										</p>
										<p className="mt-2 break-all font-mono text-sm text-slate-900">
											{getClientValue(clientCredentials?.client_id)}
										</p>
									</div>
									<Button
										buttonRole="primary"
										disabled={!clientCredentials?.client_id}
										type="button"
										onGcdsClick={() => {
											void handleCopyClientId();
										}}
									>
										{t("workspaces.applicationClientCopyAction")}
									</Button>
								</div>
								<div
									className="flex flex-col gap-2 border-b border-slate-200 px-4 py-3 md:flex-row md:items-start md:justify-between"
									data-testid="workspace-client-secret-header"
								>
									<div className="min-w-0 md:pr-6">
										<p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
											{t("workspaces.applicationClientSecretLabel")}
										</p>
									</div>
									<Button
										buttonRole="danger"
										disabled={!clientCredentials?.client_secret}
										type="button"
										onGcdsClick={() => {
											setIsRotateClientModalOpen(false);
											setIsRegenerateClientSecretModalOpen(true);
										}}
									>
										{t("workspaces.applicationClientRotateOptionRegenerate")}
									</Button>
								</div>
								<div
									className="flex flex-col gap-2 px-4 py-3 md:flex-row md:items-center md:justify-between"
									data-testid="workspace-client-secret-value"
								>
									<div className="min-w-0 md:pr-6">
										<p className="mt-2 break-all font-mono text-sm text-slate-900">
											{clientCredentials?.client_secret ??
												t("workspaces.applicationClientSecretUnavailable")}
										</p>
									</div>
									<Button
										buttonRole="primary"
										disabled={!clientCredentials?.client_secret}
										type="button"
										onGcdsClick={() => {
											void handleCopyClientSecret();
										}}
									>
										{t("workspaces.applicationClientCopyAction")}
									</Button>
								</div>
							</div>
							<div className="flex gap-4 justify-end">
								<Button
									disabled={!clientCredentials?.client_secret}
									type="button"
									onGcdsClick={() => {
										setIsRotateClientModalOpen(true);
										setIsRegenerateClientSecretModalOpen(false);
									}}
								>
									{t("workspaces.applicationClientRotateOptionNamed")}
								</Button>
								<Button
									buttonRole="secondary"
									type="button"
									onGcdsClick={closeClientModal}
								>
									{t("common.close")}
								</Button>
							</div>
						</>
					)}
				</div>
			</Modal>

			<WorkspaceClientSecretRegenerateModal
				applicationUuid={application?.uuid ?? null}
				isOpen={isRegenerateClientSecretModalOpen}
				workspaceUuid={workspaceUuid}
				onClose={closeRegenerateClientSecretModal}
				onRotated={refreshClientCredentials}
			/>

			<WorkspaceClientSecretRotateModal
				applicationUuid={application?.uuid ?? null}
				dateInputLang={dateInputLang}
				isOpen={isRotateClientModalOpen}
				workspaceUuid={workspaceUuid}
				onClose={closeRotateClientSecretModal}
				onRotated={refreshClientCredentials}
			/>
		</>
	);
};
