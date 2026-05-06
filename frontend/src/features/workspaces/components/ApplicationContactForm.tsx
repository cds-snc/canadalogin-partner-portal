import { useEffect, useState, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import type { FunctionComponent } from "@/common/types";
import type { CheckboxInputEvent } from "@/components/ui/Checkboxes";
import { Button, Checkboxes, Fieldset, Input } from "@/components/ui";
import { useToast } from "@/components/ui/Toast";
import { getRequestErrorMessage } from "@/fetch";
import {
	createWorkspaceApplicationContact,
	applicationInfoContactsQueryKey,
	type ApplicationContactRead,
	updateWorkspaceApplicationContact,
} from "@/fetch/application-info";

type ApplicationContactFormProps = {
	applicationContact?: ApplicationContactRead | null;
	applicationInfoUuid: string;
	mode?: "create" | "edit";
	onCancel: () => void;
	onSaved: () => Promise<void> | void;
	workspaceUuid: string;
};

type ContactFormState = {
	alternatePhoneNumber: string;
	contactRoles: Array<string>;
	email: string;
	firstName: string;
	lastName: string;
	phoneNumber: string;
	titleRole: string;
};

const tier2ContactTypes = [
	"OnboardingWorkgroup",
	"Comms",
	"MainSupportContact",
	"SecurityIncident",
	"CyberAuthReport",
	"Financial",
] as const;

const supportIncidentContactTypes = [
	"AuthorizedTest",
	"AuthorizedProduction",
	"AuthorizedIncidentTest",
	"AuthorizedIncidentProduction",
] as const;

const tier2GroupName = "contact_roles_tier_2";
const supportIncidentGroupName = "contact_roles_support_incident";

const emptyForm = (): ContactFormState => ({
	alternatePhoneNumber: "",
	contactRoles: [],
	email: "",
	firstName: "",
	lastName: "",
	phoneNumber: "",
	titleRole: "",
});

const getContactForm = (
	applicationContact: ApplicationContactRead | null | undefined
): ContactFormState => {
	if (!applicationContact) {
		return emptyForm();
	}

	return {
		alternatePhoneNumber: applicationContact.alternatePhoneNumber ?? "",
		contactRoles: applicationContact.contactRoles,
		email: applicationContact.email,
		firstName: applicationContact.firstName,
		lastName: applicationContact.lastName,
		phoneNumber: applicationContact.phoneNumber,
		titleRole: applicationContact.titleRole,
	};
};

export const ApplicationContactForm = ({
	applicationContact,
	applicationInfoUuid,
	mode = "create",
	onCancel,
	onSaved,
	workspaceUuid,
}: ApplicationContactFormProps): FunctionComponent => {
	const { t } = useTranslation() as unknown as { t: (key: string) => string };
	const toast = useToast();
	const queryClient = useQueryClient();
	const [form, setForm] = useState<ContactFormState>(emptyForm());
	const [isSubmitting, setIsSubmitting] = useState(false);

	useEffect(() => {
		setForm(getContactForm(mode === "edit" ? applicationContact : null));
	}, [applicationContact, mode]);

	const isEditMode = mode === "edit" && !!applicationContact;

	const handleTextInput =
		(field: keyof ContactFormState) =>
		(event: FormEvent<HTMLInputElement>): void => {
			setForm((current) => ({
				...current,
				[field]: (event.target as HTMLInputElement).value,
			}));
		};

	const getContactTypeLabels = (
		values: ReadonlyArray<string>
	): Array<string> =>
		values.map((value) => t(`workspaces.appInfoContactType${value}`));

	const handleContactRolesInput = (event: CheckboxInputEvent): void => {
		const { name, value } = event.target;
		setForm((current) => ({
			...current,
			contactRoles:
				name === tier2GroupName
					? [
						...value,
						...current.contactRoles.filter(
							(item) => !getContactTypeLabels(tier2ContactTypes).includes(item)
						),
					]
					: [
						...current.contactRoles.filter(
							(item) =>
								!getContactTypeLabels(supportIncidentContactTypes).includes(item)
						),
						...value,
					],
		}));
	};

	const buildContactTypeOptions = (
		values: ReadonlyArray<string>
	): Array<{ checked: boolean; id: string; label: string; value: string }> =>
		values.map((value) => ({
			checked: form.contactRoles.includes(
				t(`workspaces.appInfoContactType${value}`)
			),
			id: `contact-type-${value}`,
			label: t(`workspaces.appInfoContactType${value}`),
			value: t(`workspaces.appInfoContactType${value}`),
		}));

	const handleSubmit = async (
		event: FormEvent<HTMLFormElement>
	): Promise<void> => {
		event.preventDefault();
		setIsSubmitting(true);
		try {
			const payload = {
				alternatePhoneNumber: form.alternatePhoneNumber.trim() || undefined,
				contactRoles: form.contactRoles,
				email: form.email.trim(),
				firstName: form.firstName.trim(),
				lastName: form.lastName.trim(),
				phoneNumber: form.phoneNumber.trim(),
				titleRole: form.titleRole.trim(),
			};

			if (isEditMode && applicationContact) {
				await updateWorkspaceApplicationContact(
					workspaceUuid,
					applicationInfoUuid,
					applicationContact.uuid,
					payload
				);
				toast.success(t("workspaces.appInfoContactUpdatedSuccess"));
			} else {
				await createWorkspaceApplicationContact(
					workspaceUuid,
					applicationInfoUuid,
					payload
				);
				toast.success(t("workspaces.appInfoContactCreatedSuccess"));
			}

			await queryClient.invalidateQueries({
				queryKey: applicationInfoContactsQueryKey(
					workspaceUuid,
					applicationInfoUuid
				),
			});
			await onSaved();
			setForm(emptyForm());
			onCancel();
		} catch (error) {
			toast.error(getRequestErrorMessage(error, t("errors.unknown")));
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<form className="flex flex-col gap-4" onSubmit={handleSubmit}>
			<Input required inputId="contact-first-name" label={t("workspaces.appInfoContactFirstNameLabel")} name="first_name" value={form.firstName} onInput={handleTextInput("firstName")} />
			<Input required inputId="contact-last-name" label={t("workspaces.appInfoContactLastNameLabel")} name="last_name" value={form.lastName} onInput={handleTextInput("lastName")} />
			<Input required inputId="contact-title-role" label={t("workspaces.appInfoContactTitleRoleLabel")} name="title_role" value={form.titleRole} onInput={handleTextInput("titleRole")} />
			<Input required inputId="contact-email" label={t("workspaces.appInfoContactEmailLabel")} name="email" type="email" value={form.email} onInput={handleTextInput("email")} />
			<Input required inputId="contact-phone" label={t("workspaces.appInfoContactPhoneNumberLabel")} name="phone_number" value={form.phoneNumber} onInput={handleTextInput("phoneNumber")} />
			<Input inputId="contact-alt-phone" label={t("workspaces.appInfoContactAlternatePhoneNumberLabel")} name="alternate_phone_number" value={form.alternatePhoneNumber} onInput={handleTextInput("alternatePhoneNumber")} />
			<Fieldset legend={t("workspaces.appInfoContactTypesLabel")} legendSize="h3">
				<div className="grid gap-4 md:grid-cols-2">
					<Checkboxes
						legend={t("workspaces.appInfoContactTypesTier2Legend")}
						name={tier2GroupName}
						options={buildContactTypeOptions(tier2ContactTypes)}
						value={form.contactRoles}
						onInput={handleContactRolesInput}
					/>
					<Checkboxes
						legend={t("workspaces.appInfoContactTypesSupportIncidentLegend")}
						name={supportIncidentGroupName}
						options={buildContactTypeOptions(supportIncidentContactTypes)}
						value={form.contactRoles}
						onInput={handleContactRolesInput}
					/>
				</div>
			</Fieldset>
			<div className="flex justify-end gap-3">
				<Button type="button" onGcdsClick={onCancel}>{t("common.cancel")}</Button>
				<Button disabled={isSubmitting} type="submit">{isSubmitting ? t("common.saving") : t("common.save")}</Button>
			</div>
		</form>
	);
};