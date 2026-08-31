import React from "react";
import { GcdsSelect } from "@gcds-core/components-react";

interface SelectProps {
	children: React.ReactNode;
	hint?: string;
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
		hint,
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
			hideLabel={hideLabel}
			hint={hint}
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
