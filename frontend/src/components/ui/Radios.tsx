import React from "react";
import { GcdsRadios } from "@gcds-core/components-react";

type RadioObject = {
	id: string;
	label: string;
	value: string;
	hint?: string;
	checked?: boolean;
};

interface RadiosProps {
	hint?: string;
	legend: string;
	name: string;
	onInput?: React.FormEventHandler<Element>;
	value?: string;
	validateOn?: "blur" | "submit" | "other";
	required?: boolean;
	className?: string;
	options: string | Array<RadioObject>;
}

const Radios: React.FC<RadiosProps> = React.memo(
	({
		hint,
		legend,
		name,
		onInput,
		validateOn,
		required,
		value,
		className,
		options,
	}) => (
		<GcdsRadios
			className={className}
			hint={hint}
			legend={legend}
			name={name}
			options={options}
			required={required}
			validateOn={validateOn}
			value={value}
			onInput={onInput}
		></GcdsRadios>
	)
);

export default Radios;
