import React from "react";
import { GcdsTextarea } from "@gcds-core/components-react";

interface TextareaProps {
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
		hint,
		label,
		name,
		onInput,
		textareaId,
		validateOn,
		required,
		value,
		className,
	}) => (
		<GcdsTextarea
			className={className}
			hint={hint}
			label={label}
			name={name}
			required={required}
			textareaId={textareaId}
			validateOn={validateOn}
			value={value}
			onInput={onInput}
		></GcdsTextarea>
	)
);

export default Textarea;
