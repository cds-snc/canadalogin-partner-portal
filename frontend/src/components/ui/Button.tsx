import React from "react";
import { GcdsButton } from "@gcds-core/components-react";

interface ButtonProps {
	children: React.ReactNode;
	className?: string;
	disabled?: boolean;
	type: "submit" | "button" | "link" | "reset";
	buttonId?: string;
	buttonRole?: "primary" | "secondary" | "danger" | "start";
	size?: "regular" | "small";
	onGcdsClick?: (e: Event) => void;
	href?: string;
}

const activateGcdsControl = (host: Element): void => {
	const control =
		host.shadowRoot?.querySelector<HTMLElement>("[part='button']") ??
		(host as HTMLElement);
	control.click();
};

const Button: React.FC<ButtonProps> = React.memo(
	({
		children,
		className,
		disabled,
		type,
		buttonId,
		buttonRole = "primary",
		size = "regular",
		onGcdsClick,
		href,
	}): React.ReactElement => {
		const buttonRef = React.useRef<HTMLGcdsButtonElement>(null);

		// The React 19 adapter does not currently forward the Stencil properties
		// that are absent from the generated custom-element prototype.
		React.useLayoutEffect(() => {
			const button = buttonRef.current;
			if (!button) {
				return;
			}

			if (buttonId === undefined) {
				button.removeAttribute("button-id");
			} else {
				button.buttonId = buttonId;
			}
			button.buttonRole = buttonRole;
			button.disabled = disabled ?? false;
			button.href = href;
			button.size = size;
			button.type = type;
		}, [buttonId, buttonRole, disabled, href, size, type]);

		return (
			<GcdsButton
				ref={buttonRef}
				buttonId={buttonId}
				buttonRole={buttonRole}
				className={className}
				disabled={disabled}
				href={href}
				size={size}
				type={type}
				// GCDS 1.3.1's shadow button can stop its custom `gcdsClick`
				// before the React 19 adapter receives it. Capture the native
				// activation as the sole public callback path; the keyboard fallback
				// below replays this same native click instead of calling it directly.
				onClickCapture={(event) => {
					if (!disabled) {
						onGcdsClick?.(event.nativeEvent);
					}
				}}
				onKeyDownCapture={(event) => {
					if (!disabled && event.key === "Enter") {
						event.preventDefault();
						activateGcdsControl(event.currentTarget);
					} else if (!disabled && type !== "link" && event.key === " ") {
						event.preventDefault();
					}
				}}
				onKeyUpCapture={(event) => {
					if (!disabled && type !== "link" && event.key === " ") {
						event.preventDefault();
						activateGcdsControl(event.currentTarget);
					}
				}}
			>
				{children}
			</GcdsButton>
		);
	}
);

export default Button;
