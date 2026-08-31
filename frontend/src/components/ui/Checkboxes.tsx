import React from "react";
import { GcdsCheckboxes } from "@gcds-core/components-react";

type CheckObject = {
	id: string;
	label: string;
	value?: string;
	hint?: string;
	checked?: boolean;
};

export type CheckboxInputEvent = {
	target: {
		name: string;
		value: Array<string>;
	};
};

interface CheckboxProps {
	hint?: string;
	legend?: string;
	hideLabel?: boolean;
	hideLegend?: boolean;
	name: string;
	onInput?: (event: CheckboxInputEvent) => void;
	value?: Array<string>;
	validateOn?: "blur" | "submit" | "other";
	required?: boolean;
	className?: string;
	options: string | Array<CheckObject>;
}

const Checkboxes: React.FC<CheckboxProps> = React.memo(
	({
		hint,
		legend,
		hideLabel,
		hideLegend,
		name,
		onInput,
		validateOn,
		required,
		value,
		className,
		options,
	}) => (
		<GcdsCheckboxes
			className={className}
			hideLabel={hideLabel}
			hideLegend={hideLegend}
			hint={hint}
			legend={legend}
			name={name}
			options={options}
			required={required}
			validateOn={validateOn}
			value={value}
			onInput={(event): void => {
				const target = event.target as Element & {
					value?: Array<string>;
				};

				onInput?.({
					target: {
						name,
						value: target.value ?? [],
					},
				});
			}}
		></GcdsCheckboxes>
	)
);

export default Checkboxes;
