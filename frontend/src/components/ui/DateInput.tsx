import React from "react";
import { GcdsDateInput } from "@gcds-core/components-react";

interface InputProps {
	hint?: string;
	errorMessage?: string;
	lang?: string;
	legend: string;
	name: string;
	onInput?: React.FormEventHandler<Element>;
	value?: string;
	validateOn?: "blur" | "submit" | "other";
	required?: boolean;
	className?: string;
	format: "full" | "compact";
	min?: string;
	max?: string;
}

const Input: React.FC<InputProps> = React.memo(
	({
		hint,
		errorMessage,
		lang,
		legend,
		name,
		onInput,
		validateOn,
		required,
		value,
		className,
		format,
		min,
		max,
	}) => (
		<GcdsDateInput
			className={className}
			errorMessage={errorMessage}
			format={format}
			hint={hint}
			lang={lang}
			legend={legend}
			max={max}
			min={min}
			name={name}
			required={required}
			validateOn={validateOn}
			value={value}
			onInput={onInput}
		></GcdsDateInput>
	)
);

export default Input;
