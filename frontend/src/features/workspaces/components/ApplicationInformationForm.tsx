import { useTranslation } from "react-i18next";
import type { FunctionComponent } from "@/common/types";
import { Button, Input, Textarea } from "@/components/ui";
import type { ApplicationInformationFormState } from "../application-information-form";

type ApplicationInformationFormProps = {
	cancelHref: string;
	form: ApplicationInformationFormState;
	isSubmitting: boolean;
	onChange: (
		field: keyof ApplicationInformationFormState,
		value: string
	) => void;
	onSubmit: () => void;
	submitLabel: string;
};

export const ApplicationInformationForm = ({
	cancelHref,
	form,
	isSubmitting,
	onChange,
	onSubmit,
	submitLabel,
}: ApplicationInformationFormProps): FunctionComponent => {
	const { t } = useTranslation() as unknown as {
		t: (
			key: string | Array<string>,
			options?: Record<string, unknown>
		) => string;
	};
	const isSubmitDisabled =
		form.serviceNameEn.trim().length === 0 ||
		form.serviceNameFr.trim().length === 0 ||
		form.overview.trim().length === 0 ||
		form.technologyAndProtocol.trim().length === 0 ||
		form.securityAndPrivacy.trim().length === 0 ||
		form.usage.trim().length === 0 ||
		form.migrationOrTransitionPlan.trim().length === 0 ||
		isSubmitting;

	return (
		<div className="grid gap-300">
			<Input
				required
				inputId="application-information-service-name-en"
				label={t("workspaces.appInfoServiceNameEnLabel")}
				name="serviceNameEn"
				value={form.serviceNameEn}
				onInput={(event): void => {
					onChange(
						"serviceNameEn",
						(event.target as HTMLInputElement).value
					);
				}}
			/>
			<Input
				required
				inputId="application-information-service-name-fr"
				label={t("workspaces.appInfoServiceNameFrLabel")}
				name="serviceNameFr"
				value={form.serviceNameFr}
				onInput={(event): void => {
					onChange(
						"serviceNameFr",
						(event.target as HTMLInputElement).value
					);
				}}
			/>
			<Textarea
				required
				label={t("workspaces.appInfoOverviewLabel")}
				name="overview"
				textareaId="application-information-overview"
				value={form.overview}
				onInput={(event): void => {
					onChange(
						"overview",
						(event.target as HTMLTextAreaElement).value
					);
				}}
			/>
			<Textarea
				required
				label={t("workspaces.appInfoTechnologyAndProtocolLabel")}
				name="technologyAndProtocol"
				textareaId="application-information-technology-and-protocol"
				value={form.technologyAndProtocol}
				onInput={(event): void => {
					onChange(
						"technologyAndProtocol",
						(event.target as HTMLTextAreaElement).value
					);
				}}
			/>
			<Textarea
				required
				label={t("workspaces.appInfoSecurityAndPrivacyLabel")}
				name="securityAndPrivacy"
				textareaId="application-information-security-and-privacy"
				value={form.securityAndPrivacy}
				onInput={(event): void => {
					onChange(
						"securityAndPrivacy",
						(event.target as HTMLTextAreaElement).value
					);
				}}
			/>
			<Textarea
				required
				label={t("workspaces.appInfoUsageLabel")}
				name="usage"
				textareaId="application-information-usage"
				value={form.usage}
				onInput={(event): void => {
					onChange(
						"usage",
						(event.target as HTMLTextAreaElement).value
					);
				}}
			/>
			<Textarea
				required
				label={t("workspaces.appInfoMigrationOrTransitionPlanLabel")}
				name="migrationOrTransitionPlan"
				textareaId="application-information-migration-or-transition-plan"
				value={form.migrationOrTransitionPlan}
				onInput={(event): void => {
					onChange(
						"migrationOrTransitionPlan",
						(event.target as HTMLTextAreaElement).value
					);
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
				<Button buttonRole="secondary" href={cancelHref} type="link">
					{t("workspaces.cancelAction")}
				</Button>
			</div>
		</div>
	);
};