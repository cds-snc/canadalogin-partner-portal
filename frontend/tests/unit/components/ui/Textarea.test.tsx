import { useState } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import Textarea from "@/components/ui/Textarea";

beforeAll(() => {
	Object.defineProperties(ElementInternals.prototype, {
		checkValidity: {
			configurable: true,
			value: (): boolean => true,
		},
		setFormValue: {
			configurable: true,
			value: (): void => undefined,
		},
		setValidity: {
			configurable: true,
			value: (): void => undefined,
		},
		validationMessage: {
			configurable: true,
			get: (): string => "",
		},
		validity: {
			configurable: true,
			get: (): Pick<ValidityState, "valid" | "valueMissing"> => ({
				valid: true,
				valueMissing: false,
			}),
		},
	});
});

const getTextareaElements = async (): Promise<{
	host: HTMLGcdsTextareaElement;
	shadowTextarea: HTMLTextAreaElement;
}> => {
	await customElements.whenDefined("gcds-textarea");

	const host = document.querySelector<HTMLGcdsTextareaElement>("gcds-textarea");
	expect(host).toBeTruthy();

	await waitFor(() => {
		expect(host?.shadowRoot?.querySelector("textarea")).toBeTruthy();
	});

	return {
		host: host!,
		shadowTextarea: host!.shadowRoot!.querySelector("textarea")!,
	};
};

describe("Textarea GCDS integration", () => {
	it("forwards installed GCDS input events into controlled React state", async () => {
		const handleInput = vi.fn();
		const ControlledTextarea = (): React.ReactElement => {
			const [value, setValue] = useState("");

			return (
				<>
					<Textarea
						label="Redirect URIs"
						name="redirectUris"
						textareaId="redirect-uris"
						value={value}
						onInput={(event): void => {
							handleInput(event);
							setValue(
								(event.target as HTMLGcdsTextareaElement).value ?? ""
							);
						}}
					/>
					<output>{value}</output>
				</>
			);
		};
		render(<ControlledTextarea />);
		const { host, shadowTextarea } = await getTextareaElements();
		const redirectUri = "https://benefits.canada.ca/callback";

		fireEvent.input(shadowTextarea, { target: { value: redirectUri } });

		expect(handleInput).toHaveBeenCalledOnce();
		expect(host.value).toBe(redirectUri);
		expect(
			(handleInput.mock.calls[0]![0].target as HTMLGcdsTextareaElement).value
		).toBe(redirectUri);
		await waitFor(() => {
			expect(screen.getByText(redirectUri)).toBeTruthy();
			expect(shadowTextarea.value).toBe(redirectUri);
		});
	});
});
