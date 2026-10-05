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
	errorMessage?: string;
	hint?: string;
	id?: string;
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
		errorMessage,
		hint,
		id,
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
			errorMessage={errorMessage}
			hint={hint}
			id={id}
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
