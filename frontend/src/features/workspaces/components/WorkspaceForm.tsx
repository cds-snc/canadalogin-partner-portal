import { useTranslation } from "react-i18next";
import type { FunctionComponent } from "@/common/types";
import { Button, Input, Text, Textarea } from "@/components/ui";
import type { WorkspaceFormState } from "../workspace-form";

type WorkspaceFormProps = {
	cancelHref: string;
	departmentAbbreviation?: string | null;
	form: WorkspaceFormState;
	isSubmitting: boolean;
	onChange: (field: keyof WorkspaceFormState, value: string) => void;
	onSubmit: () => void;
	submitLabel: string;
};

export const WorkspaceForm = ({
	cancelHref,
	departmentAbbreviation,
	form,
	isSubmitting,
	onChange,
	onSubmit,
	submitLabel,
}: WorkspaceFormProps): FunctionComponent => {
	const { t } = useTranslation() as unknown as {
		t: (
			key: string | Array<string>,
			options?: Record<string, unknown>
		) => string;
	};
	const isSubmitDisabled = form.name.trim().length < 2 || isSubmitting;

	return (
		<div className="grid gap-300">
			<Text>
				{departmentAbbreviation
					? t("workspaces.departmentContext", {
						department: departmentAbbreviation,
					})
					: t("workspaces.departmentContextFallback")}
			</Text>
			<Input
				required
				inputId="workspace-name"
				label={t("workspaces.nameLabel")}
				name="name"
				value={form.name}
				onInput={(event): void => {
					onChange(
						"name",
						(event.target as HTMLInputElement).value
					);
				}}
			/>
			<Input
				hint={t("workspaces.slugHint")}
				inputId="workspace-slug"
				label={t("workspaces.slugLabel")}
				name="slug"
				value={form.slug}
				onInput={(event): void => {
					onChange(
						"slug",
						(event.target as HTMLInputElement).value
					);
				}}
			/>
			<Textarea
				label={t("workspaces.descriptionLabel")}
				name="description"
				textareaId="workspace-description"
				value={form.description}
				onInput={(event): void => {
					onChange(
						"description",
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