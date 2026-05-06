import React from "react";
import { GcdsFileUploader } from "@gcds-core/components-react";

interface FileUploaderProps {
	hint?: string;
	label: string;
	name: string;
	onChange?: React.FormEventHandler<Element>;
	uploaderId: string;
	value?: Array<string> | undefined;
	validateOn?: "blur" | "submit" | "other";
	required?: boolean;
	className?: string;
}

const FileUploader: React.FC<FileUploaderProps> = React.memo(
	({
		hint,
		label,
		name,
		onChange,
		uploaderId,
		validateOn,
		required,
		value,
		className,
	}) => (
		<GcdsFileUploader
			className={className}
			hint={hint}
			label={label}
			name={name}
			required={required}
			uploaderId={uploaderId}
			validateOn={validateOn}
			value={value}
			onChange={onChange}
		></GcdsFileUploader>
	)
);

export default FileUploader;
