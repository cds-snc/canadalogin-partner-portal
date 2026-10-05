import React from "react";
import { GcdsSelect } from "@gcds-core/components-react";

interface SelectProps {
	children: React.ReactNode;
	errorMessage?: string;
	hint?: string;
	id?: string;
	label: string;
	hideLabel?: boolean;
	name: string;
	onInput?: React.FormEventHandler<Element>;
	selectId: string;
	value?: string;
	defaultValue?: string;
	validateOn?: "blur" | "submit" | "other";
	required?: boolean;
}

const Select: React.FC<SelectProps> = React.memo(
	({
		children,
		errorMessage,
		hint,
		id,
		label,
		hideLabel,
		name,
		onInput,
		selectId,
		defaultValue,
		validateOn,
		required,
		value,
	}) => (
		<GcdsSelect
			defaultValue={defaultValue}
			errorMessage={errorMessage}
			hideLabel={hideLabel}
			hint={hint}
			id={id}
			label={label}
			name={name}
			required={required}
			selectId={selectId}
			validateOn={validateOn}
			value={value}
			onInput={onInput}
		>
			{children}
		</GcdsSelect>
	)
);

export default Select;
