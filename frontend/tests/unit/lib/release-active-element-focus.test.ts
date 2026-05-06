import { describe, expect, it, vi } from "vitest";
import { releaseActiveElementFocus } from "@/lib/release-active-element-focus";

describe("releaseActiveElementFocus", () => {
	it("blurs the currently focused element when it is focusable", () => {
		const button = document.createElement("button");
		document.body.append(button);
		button.focus();

		const blurSpy = vi.spyOn(button, "blur");

		releaseActiveElementFocus();

		expect(blurSpy).toHaveBeenCalledTimes(1);

		button.remove();
	});
});