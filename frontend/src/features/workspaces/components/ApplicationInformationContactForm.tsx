import { useTranslation } from "react-i18next";
import type { FunctionComponent } from "@/common/types";
import { Button, Input } from "@/components/ui";
import type { ApplicationInformationContactFormState } from "../application-information-contact-form";

type ApplicationInformationContactFormProps = {
	form: ApplicationInformationContactFormState;
	isSubmitting: boolean;
	onCancel: () => void;
	onChange: (
		field: keyof ApplicationInformationContactFormState,
		value: string
	) => void;
	onSubmit: () => void;
	submitLabel: string;
};

export const ApplicationInformationContactForm = ({
	form,
	isSubmitting,
	onCancel,
	onChange,
	onSubmit,
	submitLabel,
}: ApplicationInformationContactFormProps): FunctionComponent => {
	const { t } = useTranslation() as unknown as {
		t: (
			key: string | Array<string>,
			options?: Record<string, unknown>
		) => string;
	};
	const isSubmitDisabled =
		form.nameEn.trim().length === 0 ||
		form.nameFr.trim().length === 0 ||
		form.responsibilityEn.trim().length === 0 ||
		form.responsibilityFr.trim().length === 0 ||
		form.email.trim().length === 0 ||
		isSubmitting;

	return (
		<div className="grid gap-200">
			<Input
				required
				inputId="application-information-contact-name-en"
				label={t("workspaces.appInfoContactNameEnLabel")}
				name="nameEn"
				value={form.nameEn}
				onInput={(event): void => {
					onChange("nameEn", (event.target as HTMLInputElement).value);
				}}
			/>
			<Input
				required
				inputId="application-information-contact-name-fr"
				label={t("workspaces.appInfoContactNameFrLabel")}
				name="nameFr"
				value={form.nameFr}
				onInput={(event): void => {
					onChange("nameFr", (event.target as HTMLInputElement).value);
				}}
			/>
			<Input
				required
				inputId="application-information-contact-responsibility-en"
				label={t("workspaces.appInfoContactResponsibilityEnLabel")}
				name="responsibilityEn"
				value={form.responsibilityEn}
				onInput={(event): void => {
					onChange(
						"responsibilityEn",
						(event.target as HTMLInputElement).value
					);
				}}
			/>
			<Input
				required
				inputId="application-information-contact-responsibility-fr"
				label={t("workspaces.appInfoContactResponsibilityFrLabel")}
				name="responsibilityFr"
				value={form.responsibilityFr}
				onInput={(event): void => {
					onChange(
						"responsibilityFr",
						(event.target as HTMLInputElement).value
					);
				}}
			/>
			<Input
				required
				inputId="application-information-contact-email"
				label={t("workspaces.appInfoContactEmailLabel")}
				name="email"
				type="email"
				value={form.email}
				onInput={(event): void => {
					onChange("email", (event.target as HTMLInputElement).value);
				}}
			/>
			<Input
				inputId="application-information-contact-phone-number"
				label={t("workspaces.appInfoContactPhoneNumberLabel")}
				name="phoneNumber"
				value={form.phoneNumber}
				onInput={(event): void => {
					onChange("phoneNumber", (event.target as HTMLInputElement).value);
				}}
			/>
			<div className="flex flex-wrap gap-200">
				<Button
					disabled={isSubmitDisabled}
					type="button"
					onGcdsClick={onSubmit}
				>
					{submitLabel}
				</Button>
				<Button buttonRole="secondary" type="button" onGcdsClick={onCancel}>
					{t("workspaces.cancelAction")}
				</Button>
			</div>
		</div>
	);
};