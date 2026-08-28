import React from "react";
import { useTranslation } from "react-i18next";
import { GcdsTextarea } from "@gcds-core/components-react";

interface TextareaProps {
	errorMessage?: string;
	hint?: string;
	label: string;
	name: string;
	onInput?: React.FormEventHandler<Element>;
	textareaId: string;
	value?: string;
	validateOn?: "blur" | "submit" | "other";
	required?: boolean;
	className?: string;
}

const Textarea: React.FC<TextareaProps> = React.memo(
	({
		errorMessage,
		hint,
		label,
		name,
		onInput,
		textareaId,
		validateOn,
		required,
		value,
		className,
	}) => {
		const { i18n } = useTranslation();
		const lang = i18n.language?.startsWith("fr") ? "fr" : "en";
		const textareaRef = React.useRef<HTMLGcdsTextareaElement>(null);

		React.useLayoutEffect(() => {
			const textarea = textareaRef.current;
			if (!textarea) {
				return;
			}

			textarea.errorMessage = errorMessage;
			textarea.hint = hint;
			textarea.label = label;
			textarea.name = name;
			textarea.required = required ?? false;
			textarea.textareaId = textareaId;
			textarea.validateOn = validateOn ?? "blur";
			textarea.value = value;
		}, [
			errorMessage,
			hint,
			label,
			name,
			required,
			textareaId,
			validateOn,
			value,
		]);

		React.useLayoutEffect(() => {
			const textarea = textareaRef.current;
			if (!textarea || !onInput) {
				return;
			}

			const handleGcdsInput = (event: Event): void => {
				onInput(event as unknown as React.FormEvent<Element>);
			};
			textarea.addEventListener("gcdsInput", handleGcdsInput);

			return (): void => {
				textarea.removeEventListener("gcdsInput", handleGcdsInput);
			};
		}, [onInput]);

		return (
			<GcdsTextarea
				ref={textareaRef}
				className={className}
				errorMessage={errorMessage}
				hint={hint}
				id={textareaId}
				label={label}
				lang={lang}
				name={name}
				required={required}
				textareaId={textareaId}
				validateOn={validateOn}
				value={value}
			></GcdsTextarea>
		);
	}
);

export default Textarea;
