import { TrashIcon } from "@heroicons/react/24/outline";
import { GcdsLabel } from "@gcds-core/components-react";
import type { FormEvent } from "react";
import {
	Controller,
	type Control,
	type FieldPath,
	type FieldValues,
} from "react-hook-form";
import type { FunctionComponent } from "@/common/types";
import { Button, Fieldset, Grid, Input, Link } from "@/components/ui";

type EnvironmentUrlListFieldsProps<T extends FieldValues> = {
	control: Control<T>;
	errorMessage: (index: number) => string | undefined;
	fieldName: FieldPath<T>;
	getFieldLabel: (index: number) => string;
	hint: string;
	legend: string;
	removeLabel: string;
	rowClassName?: string;
	setValues: (values: Array<string>) => void;
	values: Array<string>;
	addLabel: string;
	idPrefix: string;
};

const inputValue = (event: FormEvent<Element>): string =>
	(event.target as HTMLInputElement).value;

export const EnvironmentUrlListFields = <T extends FieldValues>({
	addLabel,
	control,
	errorMessage,
	fieldName,
	getFieldLabel,
	hint,
	idPrefix,
	legend,
	removeLabel,
	rowClassName,
	setValues,
	values,
}: EnvironmentUrlListFieldsProps<T>): FunctionComponent => {
	const rowCount = Math.max(1, values.length);

	return (
		<Fieldset hint={hint} legend={legend} legendSize="h3">
			{Array.from({ length: rowCount }, (_, index) => (
				<Grid
					key={index}
					className={`endpoint-url-row${rowClassName ? ` ${rowClassName}` : ""}`}
					columns="1fr"
					tag="div"
				>
					<Grid
						alignItems="start"
						className="endpoint-label-row"
						columns="auto auto 1fr"
						tag="div"
					>
						<GcdsLabel
							className="endpoint-label"
							label={getFieldLabel(index)}
							labelFor={`${idPrefix}-control-${index}`}
							required={index === 0}
						/>
						{rowCount > 1 && index > 0 && (
							<Link
								href={`#${idPrefix}-${index}`}
								size="small"
								onGcdsClick={(event) => {
									event.preventDefault();
									setValues(
										values.filter((_, valueIndex) => valueIndex !== index)
									);
								}}
							>
								<span
									style={{
										alignItems: "center",
										display: "inline-flex",
										gap: "var(--gcds-spacing-100)",
									}}
								>
									<TrashIcon aria-hidden="true" height="1em" width="1em" />
									{removeLabel}
								</span>
							</Link>
						)}
					</Grid>
					<Controller
						control={control}
						name={`${fieldName}.${index}` as FieldPath<T>}
						render={({ field }) => (
							<Input
								hideLabel
								errorMessage={errorMessage(index)}
								id={`${idPrefix}-control-${index}`}
								inputId={`${idPrefix}-${index}`}
								label={getFieldLabel(index)}
								name={field.name}
								required={index === 0}
								value={field.value}
								onInput={(event) => {
									field.onChange(inputValue(event));
								}}
							/>
						)}
					/>
				</Grid>
			))}
			<Button
				buttonRole="secondary"
				size="small"
				type="button"
				onGcdsClick={() => {
					setValues([...values, ""]);
				}}
			>
				<span aria-hidden="true">+</span> {addLabel}
			</Button>
		</Fieldset>
	);
};
