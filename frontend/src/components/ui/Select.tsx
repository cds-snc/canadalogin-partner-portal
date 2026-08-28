import React from "react";
import { useTranslation } from "react-i18next";
import { GcdsSelect } from "@gcds-core/components-react";

interface SelectProps {
	children: React.ReactNode;
	errorMessage?: string;
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
		errorMessage,
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
	}) => {
		const { i18n } = useTranslation();
		const lang = i18n.language?.startsWith("fr") ? "fr" : "en";

		return (
			<GcdsSelect
				defaultValue={defaultValue}
				errorMessage={errorMessage}
				hideLabel={hideLabel}
				hint={hint}
				id={selectId}
				label={label}
				lang={lang}
				name={name}
				required={required}
				selectId={selectId}
				validateOn={validateOn}
				value={value}
				onInput={onInput}
			>
				{children}
			</GcdsSelect>
		);
	}
);

export default Select;
