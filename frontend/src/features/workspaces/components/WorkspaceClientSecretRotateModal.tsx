import { useState, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import type { FunctionComponent } from "@/common/types";
import { getRequestErrorMessage } from "@/fetch";
import { Button, DateInput, Input, Modal } from "@/components/ui";
import { useToast } from "@/components/ui/Toast";
import {
	createRPApplicationRotatedClientSecret,
	deleteRPApplicationRotatedClientSecret,
	getRPApplicationRotatedClientSecrets,
	type RPApplicationRotatedSecretCreateRequest,
} from "@/fetch/workspaces";
import {
	formatDateValue,
	formatTimestamp,
	getRotatedSecretForm,
	type RotatedSecretFormState,
	type RotatedSecretListItem,
	addDays,
} from "./workspace-detail-utils";

type WorkspaceClientSecretRotateModalProps = {
	applicationUuid: string | null;
	dateInputLang: "en" | "fr";
	isOpen: boolean;
	workspaceUuid: string;
	onClose: () => void;
	onRotated: () => Promise<void> | void;
};

export const WorkspaceClientSecretRotateModal = (
	props: WorkspaceClientSecretRotateModalProps
): FunctionComponent => {
	const {
		applicationUuid,
		dateInputLang,
		isOpen,
		onClose,
		onRotated,
		workspaceUuid,
	} = props;
	const { t } = useTranslation() as unknown as {
		t: (key: string | Array<string>, opts?: Record<string, unknown>) => string;
	};
	const toast = useToast();
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [rotatedSecretForm, setRotatedSecretForm] =
		useState<RotatedSecretFormState>(getRotatedSecretForm());
	const today = new Date();
	const minRotateDate = formatDateValue(addDays(today, 1));
	const maxRotateDate = formatDateValue(addDays(today, 30));
	const rotateDateErrorMessage = t(
		"workspaces.applicationClientRotateDateError"
	);

	const {
		data: rotatedSecrets,
		isLoading: isRotatedSecretsLoading,
		refetch: refetchRotatedSecrets,
	} = useQuery<Array<RotatedSecretListItem>>({
		queryKey: [
			"workspace-rotated-client-secrets",
			workspaceUuid,
			applicationUuid,
		],
		queryFn: () =>
			applicationUuid
				? getRPApplicationRotatedClientSecrets(workspaceUuid, applicationUuid)
				: Promise.resolve<Array<RotatedSecretListItem>>([]),
		enabled: isOpen && !!applicationUuid,
	});
	const rotatedSecretItems: Array<RotatedSecretListItem> = rotatedSecrets ?? [];

	const refreshRotatedSecrets = async (): Promise<void> => {
		await refetchRotatedSecrets();
		await onRotated();
	};

	const handleRotatedSecretDescriptionInput = (
		event: FormEvent<HTMLInputElement>
	): void => {
		setRotatedSecretForm((current) => ({
			...current,
			description: (event.target as HTMLInputElement).value,
		}));
	};

	const handleRotatedSecretExpiresAtInput = (
		event: FormEvent<HTMLInputElement>
	): void => {
		setRotatedSecretForm((current) => ({
			...current,
			expiresAt: (event.target as HTMLInputElement).value,
		}));
	};

	const handleCreateRotatedClientSecret = async (): Promise<void> => {
		if (!applicationUuid) {
			return;
		}

		setIsSubmitting(true);
		try {
			const payload: RPApplicationRotatedSecretCreateRequest = {
				description: rotatedSecretForm.description.trim(),
				rotatedSecretExpiredAt: Math.floor(
					new Date(rotatedSecretForm.expiresAt).getTime() / 1000
				),
			};
			await createRPApplicationRotatedClientSecret(
				workspaceUuid,
				applicationUuid,
				payload
			);
			setRotatedSecretForm(getRotatedSecretForm());
			await refreshRotatedSecrets();
			toast.success(t("workspaces.applicationRotateSecretSuccess"));
		} catch (error) {
			console.error(error);
			toast.error(getRequestErrorMessage(error, t("errors.unknown")));
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleDeleteRotatedClientSecret = async (
		rotatedSecretId: string | null | undefined
	): Promise<void> => {
		if (!applicationUuid || !rotatedSecretId) {
			return;
		}

		setIsSubmitting(true);
		try {
			await deleteRPApplicationRotatedClientSecret(
				workspaceUuid,
				applicationUuid,
				rotatedSecretId
			);
			await refreshRotatedSecrets();
			toast.success(t("workspaces.applicationRotateSecretSuccess"));
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
			description={t("workspaces.applicationClientRotateOptionNamedHelp")}
			isOpen={isOpen}
			title={t("workspaces.applicationClientRotateConfirmTitle")}
			onClose={onClose}
		>
			<div className="flex flex-col gap-4">
				<div className="rounded border border-slate-300 bg-slate-50 p-4">
					<h3 className="text-sm font-semibold text-slate-900">
						{t("workspaces.applicationClientRotateOptionNamed")}
					</h3>
					<p className="mt-2 text-sm text-slate-700">
						{t("workspaces.applicationClientRotateOptionNamedHelp")}
					</p>
				</div>

				<div className="flex flex-col gap-3 rounded border border-slate-300 bg-white p-4">
					<Input
						required
						inputId="rotate-client-description"
						label={t("workspaces.applicationClientRotateNameLabel")}
						name="description"
						value={rotatedSecretForm.description}
						onInput={handleRotatedSecretDescriptionInput}
					/>
					<DateInput
						required
						errorMessage={rotateDateErrorMessage}
						format="full"
						hint={t("workspaces.applicationClientRotateDateHint")}
						lang={dateInputLang}
						legend={t("workspaces.applicationClientRotateDateLabel")}
						max={maxRotateDate}
						min={minRotateDate}
						name="expires_at"
						value={rotatedSecretForm.expiresAt}
						onInput={handleRotatedSecretExpiresAtInput}
					/>
				</div>

				<div className="rounded border border-slate-300 bg-white p-4">
					<div className="flex items-center justify-between gap-4">
						<h3 className="text-sm font-semibold text-slate-900">
							{t("workspaces.applicationClientRotatedSecretsTitle")}
						</h3>
						<Button
							disabled={isSubmitting}
							type="button"
							onGcdsClick={() => {
								void handleCreateRotatedClientSecret();
							}}
						>
							{isSubmitting
								? t("common.saving")
								: t("workspaces.applicationClientRotateAddAction")}
						</Button>
					</div>
					<div className="mt-4 overflow-hidden rounded border border-slate-200">
						<table className="min-w-full divide-y divide-slate-200 bg-white">
							<thead className="bg-slate-50">
								<tr>
									<th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
										{t(
											"workspaces.applicationClientRotatedSecretsDescriptionHeader"
										)}
									</th>
									<th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
										{t(
											"workspaces.applicationClientRotatedSecretsExpiresHeader"
										)}
									</th>
									<th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-slate-600">
										{t(
											"workspaces.applicationClientRotatedSecretsActionHeader"
										)}
									</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-slate-200">
								{isRotatedSecretsLoading ? (
									<tr>
										<td
											className="px-3 py-3 text-sm text-slate-700"
											colSpan={3}
										>
											{t("workspaces.loadingApplications")}
										</td>
									</tr>
								) : rotatedSecretItems.length > 0 ? (
									rotatedSecretItems.map((secret) => (
										<tr
											key={
												secret.value ??
												`${secret.description ?? "secret"}-${secret.expired_at ?? 0}`
											}
										>
											<td className="px-3 py-3 text-sm font-semibold text-slate-900">
												{secret.description ?? "-"}
											</td>
											<td className="px-3 py-3 text-sm text-slate-700">
												{formatTimestamp(secret.expired_at)}
											</td>
											<td className="px-3 py-3 text-right">
												<Button
													buttonRole="secondary"
													disabled={isSubmitting}
													type="button"
													onGcdsClick={() => {
														void handleDeleteRotatedClientSecret(secret.value);
													}}
												>
													{t("workspaces.delete")}
												</Button>
											</td>
										</tr>
									))
								) : (
									<tr>
										<td
											className="px-3 py-3 text-sm text-slate-700"
											colSpan={3}
										>
											{t("workspaces.applicationClientRotatedSecretsEmpty")}
										</td>
									</tr>
								)}
							</tbody>
						</table>
					</div>
				</div>
			</div>
		</Modal>
	);
};
