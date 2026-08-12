import React from "react";
import { useTranslation } from "react-i18next";
import { GcdsInput } from "@gcds-core/components-react";

interface InputProps {
	errorMessage?: string;
	hint?: string;
	label: string;
	name: string;
	onInput?: React.FormEventHandler<Element>;
	onKeyDown?: React.KeyboardEventHandler<Element>;
	inputId: string;
	maxLength?: number;
	minLength?: number;
	value?: string;
	validateOn?: "blur" | "submit" | "other";
	required?: boolean;
	size?: number;
	className?: string;
	type?: "text" | "email" | "number" | "password" | "search";
}

const Input: React.FC<InputProps> = React.memo(
	({
		errorMessage,
		hint,
		label,
		name,
		onInput,
		onKeyDown,
		inputId,
		maxLength,
		minLength,
		validateOn,
		required,
		value,
		size,
		className,
		type,
	}): React.ReactElement => {
		const { i18n } = useTranslation();
		const lang = i18n.language?.startsWith("fr") ? "fr" : "en";
		const inputRef = React.useRef<HTMLGcdsInputElement>(null);

		// The React 19 adapter can treat GCDS properties as host attributes when
		// they are absent from the generated custom-element prototype. Keep the
		// element properties authoritative so its shadow input stays controlled.
		React.useLayoutEffect(() => {
			const input = inputRef.current;
			if (!input) {
				return;
			}

			input.errorMessage = errorMessage;
			input.hint = hint;
			input.inputId = inputId;
			input.label = label;
			input.maxlength = maxLength;
			input.minlength = minLength;
			input.name = name;
			input.required = required ?? false;
			input.size = size;
			input.type = type ?? "text";
			input.validateOn = validateOn ?? "blur";
			input.value = value;
		}, [
			errorMessage,
			hint,
			inputId,
			label,
			maxLength,
			minLength,
			name,
			required,
			size,
			type,
			validateOn,
			value,
		]);

		// GCDS emits `gcdsInput` after synchronizing the host value. The generated
		// React adapter does not attach that mapped custom event under React 19, so
		// manage the native listener directly while preserving this wrapper's API.
		React.useLayoutEffect(() => {
			const input = inputRef.current;
			if (!input || !onInput) {
				return;
			}

			const handleGcdsInput = (event: Event): void => {
				onInput(event as unknown as React.FormEvent<Element>);
			};
			input.addEventListener("gcdsInput", handleGcdsInput);

			return (): void => {
				input.removeEventListener("gcdsInput", handleGcdsInput);
			};
		}, [onInput]);

		return (
			<GcdsInput
				ref={inputRef}
				className={className}
				errorMessage={errorMessage}
				hint={hint}
				id={inputId}
				inputId={inputId}
				label={label}
				lang={lang}
				maxlength={maxLength}
				minlength={minLength}
				name={name}
				required={required}
				size={size}
				type={type}
				validateOn={validateOn}
				value={value}
				onKeyDownCapture={onKeyDown}
			></GcdsInput>
		);
	}
);

export default Input;
