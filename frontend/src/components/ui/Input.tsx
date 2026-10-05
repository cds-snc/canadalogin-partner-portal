import React from "react";
import { GcdsInput } from "@gcds-core/components-react";

interface InputProps {
	ariaDescribedBy?: string;
	errorMessage?: string;
	hideLabel?: boolean;
	hint?: string;
	id?: string;
	label: string;
	name: string;
	onInput?: React.FormEventHandler<Element>;
	onKeyDown?: React.KeyboardEventHandler<Element>;
	inputId: string;
	value?: string;
	validateOn?: "blur" | "submit" | "other";
	required?: boolean;
	size?: number;
	className?: string;
	type?: "text" | "email" | "number" | "password" | "search";
}

const Input: React.FC<InputProps> = React.memo(
	({
		ariaDescribedBy,
		hideLabel,
		errorMessage,
		hint,
		id,
		label,
		name,
		onInput,
		onKeyDown,
		inputId,
		validateOn,
		required,
		value,
		size,
		className,
		type,
	}) => (
		<GcdsInput
			aria-describedby={ariaDescribedBy}
			className={className}
			errorMessage={errorMessage}
			hideLabel={hideLabel}
			hint={hint}
			id={id}
			inputId={inputId}
			label={label}
			name={name}
			required={required}
			size={size}
			type={type}
			validateOn={validateOn}
			value={value}
			onInput={onInput}
			onKeyDown={onKeyDown}
		></GcdsInput>
	)
);

export default Input;
