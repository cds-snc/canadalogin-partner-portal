import { fireEvent, render, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Button from "@/components/ui/Button";

const getButtonElements = async (): Promise<{
	host: HTMLElement;
	shadowButton: HTMLButtonElement;
}> => {
	await customElements.whenDefined("gcds-button");

	const host = document.querySelector<HTMLElement>("gcds-button");
	expect(host).toBeTruthy();

	await waitFor(() => {
		expect(host?.shadowRoot?.querySelector("button")).toBeTruthy();
	});

	return {
		host: host!,
		shadowButton: host!.shadowRoot!.querySelector("button")!,
	};
};

describe("Button GCDS integration", () => {
	it("activates once after changing from disabled to enabled", async () => {
		const handleClick = vi.fn();
		const { rerender } = render(
			<Button
				buttonId="continue"
				buttonRole="secondary"
				disabled
				size="small"
				type="button"
				onGcdsClick={handleClick}
			>
				Continue
			</Button>
		);
		const { shadowButton: disabledButton } = await getButtonElements();
		await waitFor(() => {
			expect(disabledButton.getAttribute("aria-disabled")).toBe("true");
			expect(disabledButton.id).toBe("continue");
			expect(disabledButton.classList).toContain("button--role-secondary");
			expect(disabledButton.classList).toContain("button--small");
		});

		disabledButton.click();
		expect(handleClick).not.toHaveBeenCalled();

		rerender(
			<Button
				buttonId="continue"
				buttonRole="secondary"
				size="small"
				type="button"
				onGcdsClick={handleClick}
			>
				Continue
			</Button>
		);
		const { shadowButton: enabledButton } = await getButtonElements();
		await waitFor(() => {
			expect(enabledButton.getAttribute("aria-disabled")).toBe("false");
		});

		enabledButton.click();

		expect(handleClick).toHaveBeenCalledOnce();
	});

	it("supports Enter and Space activation without duplicate callbacks", async () => {
		const handleClick = vi.fn();
		render(
			<Button type="button" onGcdsClick={handleClick}>
				Continue
			</Button>
		);
		const { shadowButton } = await getButtonElements();
		shadowButton.focus();
		expect(fireEvent.keyDown(shadowButton, { key: "Enter" })).toBe(false);
		fireEvent.keyUp(shadowButton, { key: "Enter" });
		expect(handleClick).toHaveBeenCalledTimes(1);

		expect(fireEvent.keyDown(shadowButton, { key: " " })).toBe(false);
		expect(fireEvent.keyUp(shadowButton, { key: " " })).toBe(false);
		expect(handleClick).toHaveBeenCalledTimes(2);
	});

	it("preserves keyboard submission without requiring a click callback", async () => {
		const handleSubmit = vi.fn((event: React.FormEvent<HTMLFormElement>) => {
			event.preventDefault();
		});
		render(
			<form onSubmit={handleSubmit}>
				<Button type="submit">Save</Button>
			</form>
		);
		const { shadowButton } = await getButtonElements();
		await waitFor(() => {
			expect(shadowButton.type).toBe("submit");
		});

		shadowButton.focus();
		expect(fireEvent.keyDown(shadowButton, { key: "Enter" })).toBe(false);

		expect(handleSubmit).toHaveBeenCalledOnce();
	});
});
