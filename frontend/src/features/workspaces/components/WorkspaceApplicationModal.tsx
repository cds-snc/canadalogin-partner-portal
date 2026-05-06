import { useEffect, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import type { FunctionComponent } from "@/common/types";
import { getRequestErrorMessage } from "@/fetch";
import { Button, Input, Modal, Select, Textarea } from "@/components/ui";
import { useToast } from "@/components/ui/Toast";
import {
	createRPApplication,
	type CurrentUserRPApplicationRead,
	type RPApplicationCreate,
	type RPApplicationSettings,
	updateRPApplication,
	updateCurrentUserRPApplication,
	type RPApplicationUpdate,
} from "@/fetch/workspaces";
import {
	emptyAppForm,
	getRedirectUrisValue,
	getSettingBoolean,
	getSettingClientType,
	getSettingString,
	parseRedirectUris,
	type AppFormState,
} from "./workspace-detail-utils";

export type WorkspaceApplicationCreateContext = {
	applicationInfoUuid: string;
	initialForm?: Partial<AppFormState>;
};

type EditableRPApplication = {
	name: string;
	settings: RPApplicationSettings | null;
	uuid: string;
};

type WorkspaceApplicationModalProps = {
	application: EditableRPApplication | CurrentUserRPApplicationRead | null;
	createContext?: WorkspaceApplicationCreateContext | null;
	currentUserMode?: boolean;
	isOpen: boolean;
	mode: "create" | "edit" | null;
	onClose: () => void;
	onSaved: () => Promise<void> | void;
	workspaceUuid: string;
};

const getApplicationForm = (
	application: EditableRPApplication | CurrentUserRPApplicationRead | null
): AppFormState => {
	if (!application) {
		return emptyAppForm();
	}

	return {
		applicationUrl: getSettingString(application.settings, "application_url"),
		clientType: getSettingClientType(application.settings),
		companyName: getSettingString(application.settings, "company_name"),
		description: getSettingString(application.settings, "description"),
		name: application.name,
		pkceEnabled: getSettingBoolean(application.settings, "pkce_enabled"),
		redirectUris: getRedirectUrisValue(application.settings),
	};
};

const getCreateApplicationForm = (
	createContext?: WorkspaceApplicationCreateContext | null
): AppFormState => ({
	...emptyAppForm(),
	...createContext?.initialForm,
});

const buildAppPayload = (
	form: AppFormState,
	applicationInfoUuid?: string,
	includeClientType = false
): RPApplicationCreate => {
	const payload: RPApplicationCreate = {
		description: form.description.trim() || undefined,
		name: form.name.trim(),
	};

	if (applicationInfoUuid) {
		payload.applicationInfoUuid = applicationInfoUuid;
	}

	payload["application_url"] = form.applicationUrl.trim() || undefined;
	if (includeClientType || form.clientType === "public") {
		payload["client_type"] = form.clientType;
	}
	if (form.companyName.trim()) {
		payload["company_name"] = form.companyName.trim();
	}
	payload["pkce_enabled"] =
		form.clientType === "public" ? true : form.pkceEnabled;
	payload["redirect_uris"] = parseRedirectUris(form.redirectUris);

	return payload;
};

export const WorkspaceApplicationModal = (
	props: WorkspaceApplicationModalProps
): FunctionComponent => {
	const {
		application,
		createContext,
		currentUserMode = false,
		isOpen,
		mode,
		onClose,
		onSaved,
		workspaceUuid,
	} = props;
	const { t } = useTranslation() as unknown as {
		t: (key: string | Array<string>, opts?: Record<string, unknown>) => string;
	};
	const toast = useToast();
	const [form, setForm] = useState<AppFormState>(emptyAppForm());
	const [isSubmitting, setIsSubmitting] = useState(false);
	const isEditMode = mode === "edit" && application !== null;

	useEffect(() => {
		if (!isOpen) {
			setForm(emptyAppForm());
			return;
		}

		setForm(
			isEditMode
				? getApplicationForm(application)
				: getCreateApplicationForm(createContext)
		);
	}, [application, createContext, isEditMode, isOpen]);

	const modalTitle = isEditMode
		? t("workspaces.editApplicationModalTitle")
		: t("workspaces.createApplicationModalTitle");

	const handleSubmit = async (
		event: FormEvent<HTMLFormElement>
	): Promise<void> => {
		event.preventDefault();
		if (isEditMode && !application) {
			return;
		}

		setIsSubmitting(true);
		try {
			const payload = buildAppPayload(
				form,
				isEditMode ? undefined : createContext?.applicationInfoUuid,
				isEditMode
			);
			if (isEditMode) {
				const updatePayload: RPApplicationUpdate = payload;
				if (currentUserMode) {
					await updateCurrentUserRPApplication(
						application.uuid,
						updatePayload
					);
				} else {
					await updateRPApplication(
						workspaceUuid,
						application.uuid,
						updatePayload
					);
				}
				toast.success(t("workspaces.applicationUpdatedSuccess"));
			} else {
				await createRPApplication(workspaceUuid, payload);
				toast.success(t("workspaces.applicationCreatedSuccess"));
			}
			await onSaved();
			onClose();
		} catch (error) {
			console.error(error);
			toast.error(getRequestErrorMessage(error, t("errors.unknown")));
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleNameInput = (event: FormEvent<HTMLInputElement>): void => {
		setForm((current) => ({
			...current,
			name: (event.target as HTMLInputElement).value,
		}));
	};

	const handleDescriptionInput = (event: FormEvent<HTMLInputElement>): void => {
		setForm((current) => ({
			...current,
			description: (event.target as HTMLInputElement).value,
		}));
	};

	const handleCompanyNameInput = (event: FormEvent<HTMLInputElement>): void => {
		setForm((current) => ({
			...current,
			companyName: (event.target as HTMLInputElement).value,
		}));
	};

	const handleUrlInput = (event: FormEvent<HTMLInputElement>): void => {
		setForm((current) => ({
			...current,
			applicationUrl: (event.target as HTMLInputElement).value,
		}));
	};

	const handleClientTypeInput = (event: FormEvent<HTMLSelectElement>): void => {
		const nextClientType =
			(event.target as HTMLSelectElement).value === "public"
				? "public"
				: "confidential";

		setForm((current) => ({
			...current,
			clientType: nextClientType,
			pkceEnabled: nextClientType === "public" ? true : current.pkceEnabled,
		}));
	};

	const handlePkceInput = (event: FormEvent<HTMLSelectElement>): void => {
		setForm((current) => ({
			...current,
			pkceEnabled: (event.target as HTMLSelectElement).value === "true",
		}));
	};

	const handleRedirectUrisInput = (event: FormEvent<Element>): void => {
		setForm((current) => ({
			...current,
			redirectUris: (event.target as HTMLTextAreaElement).value,
		}));
	};

	if (!isOpen) {
		return null;
	}

	return (
		<Modal isOpen={isOpen} size="wide" title={modalTitle} onClose={onClose}>
			<form className="flex flex-col gap-4" onSubmit={handleSubmit}>
				<Input
					required
					inputId="app-name"
					label={t("workspaces.applicationNameLabel")}
					name="name"
					value={form.name}
					onInput={handleNameInput}
				/>

				<Input
					inputId="app-description"
					label={t("workspaces.applicationDescriptionLabel")}
					name="description"
					value={form.description}
					onInput={handleDescriptionInput}
				/>

				<Input
					inputId="app-company-name"
					label={t("workspaces.applicationCompanyNameLabel")}
					name="company_name"
					value={form.companyName}
					onInput={handleCompanyNameInput}
				/>

				<Select
					label={t("workspaces.applicationClientTypeLabel")}
					name="client_type"
					selectId="app-client-type"
					value={form.clientType}
					onInput={handleClientTypeInput}
				>
					<option value="confidential">
						{t("workspaces.applicationClientTypeConfidentialOption")}
					</option>
					<option value="public">
						{t("workspaces.applicationClientTypePublicOption")}
					</option>
				</Select>

				{form.clientType !== "public" ? (
					<Select
						label={t("workspaces.applicationPkceLabel")}
						name="pkce_enabled"
						selectId="app-pkce-enabled"
						value={form.pkceEnabled ? "true" : "false"}
						onInput={handlePkceInput}
					>
						<option value="false">
							{t("workspaces.applicationPkceDisabledOption")}
						</option>
						<option value="true">
							{t("workspaces.applicationPkceEnabledOption")}
						</option>
					</Select>
				) : null}

				<Input
					inputId="app-url"
					label={t("workspaces.applicationUrlLabel")}
					name="application_url"
					value={form.applicationUrl}
					onInput={handleUrlInput}
				/>

				<Textarea
					hint={t("workspaces.applicationRedirectUrisHint")}
					label={t("workspaces.applicationRedirectUrisLabel")}
					name="redirect_uris"
					textareaId="app-redirect-uris"
					value={form.redirectUris}
					onInput={handleRedirectUrisInput}
				/>

				<div className="flex gap-4 justify-end">
					<Button buttonRole="secondary" type="button" onGcdsClick={onClose}>
						{t("common.cancel")}
					</Button>
					<Button disabled={isSubmitting || !form.name.trim()} type="submit">
						{isSubmitting ? t("common.saving") : t("common.save")}
					</Button>
				</div>
			</form>
		</Modal>
	);
};
