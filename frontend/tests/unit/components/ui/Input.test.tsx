import { useState } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import Input from "@/components/ui/Input";

beforeAll(() => {
	// jsdom exposes ElementInternals but not the form-associated methods GCDS
	// invokes. Supply only that missing browser surface so the installed custom
	// element itself can render and emit its real events in this regression test.
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

const getInputElements = async (): Promise<{
	host: HTMLGcdsInputElement;
	shadowInput: HTMLInputElement;
}> => {
	await customElements.whenDefined("gcds-input");

	const host = document.querySelector<HTMLGcdsInputElement>("gcds-input");
	expect(host).toBeTruthy();

	await waitFor(() => {
		expect(host?.shadowRoot?.querySelector("input")).toBeTruthy();
	});

	return {
		host: host!,
		shadowInput: host!.shadowRoot!.querySelector("input")!,
	};
};

describe("Input GCDS integration", () => {
	it("forwards installed GCDS input events into controlled React state", async () => {
		const handleInput = vi.fn();
		const ControlledInput = (): React.ReactElement => {
			const [value, setValue] = useState("");

			return (
				<>
					<Input
						inputId="candidate-search"
						label="Search users"
						maxLength={100}
						minLength={2}
						name="candidate-search"
						type="search"
						validateOn="other"
						value={value}
						onInput={(event): void => {
							handleInput(event);
							setValue((event.target as HTMLInputElement).value);
						}}
					/>
					<output>{value}</output>
				</>
			);
		};
		render(<ControlledInput />);
		const { host, shadowInput } = await getInputElements();
		const candidateEmail = "local-no-access@local.example";
		const handleGcdsInput = vi.fn();
		host.addEventListener("gcdsInput", handleGcdsInput);

		fireEvent.input(shadowInput, { target: { value: candidateEmail } });

		expect(handleGcdsInput).toHaveBeenCalledOnce();
		expect(handleInput).toHaveBeenCalledOnce();
		expect(host.value).toBe(candidateEmail);
		expect(
			(handleInput.mock.calls[0]![0].target as HTMLGcdsInputElement).value
		).toBe(candidateEmail);
		await waitFor(() => {
			expect(screen.getByText(candidateEmail)).toBeTruthy();
			expect(shadowInput.value).toBe(candidateEmail);
		});
	});

	it("synchronizes search and validation properties with the shadow input", async () => {
		const handleKeyDown = vi.fn();
		render(
			<Input
				required
				errorMessage="Enter between 2 and 100 characters"
				hint="Search by name or email"
				inputId="candidate-search"
				label="Search users"
				maxLength={100}
				minLength={2}
				name="candidate-search"
				type="search"
				validateOn="other"
				value="local"
				onKeyDown={handleKeyDown}
			/>
		);
		const { host, shadowInput } = await getInputElements();

		await waitFor(() => {
			expect(host.inputId).toBe("candidate-search");
			expect(host.label).toBe("Search users");
			expect(host.hint).toBe("Search by name or email");
			expect(host.errorMessage).toBe("Enter between 2 and 100 characters");
			expect(host.validateOn).toBe("other");
			expect(shadowInput.id).toBe("candidate-search");
			expect(shadowInput.name).toBe("candidate-search");
			expect(shadowInput.type).toBe("search");
			expect(shadowInput.minLength).toBe(2);
			expect(shadowInput.maxLength).toBe(100);
			expect(shadowInput.required).toBe(true);
			expect(shadowInput.value).toBe("local");
		});

		fireEvent.keyDown(shadowInput, { key: "Enter" });
		expect(handleKeyDown).toHaveBeenCalledOnce();
	});
});
