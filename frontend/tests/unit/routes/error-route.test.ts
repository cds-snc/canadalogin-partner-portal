import { createElement, type ComponentType } from "react";
import { render, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Route } from "@/routes/error";
import { Route as RootRoute } from "@/routes/__root";

describe("error route", () => {
	it("maps known kinds and falls back unknown values to unexpected", () => {
		const validateSearch = (Route as any).options?.validateSearch;
		expect(validateSearch).toBeTypeOf("function");

		expect(validateSearch({ kind: "not_found" })).toEqual({
			kind: "not_found",
		});
		expect(validateSearch({ kind: "unexpected" })).toEqual({
			kind: "unexpected",
		});
		expect(validateSearch({ kind: "anything-else" })).toEqual({
			kind: "unexpected",
		});
		expect(validateSearch({})).toEqual({ kind: "unexpected" });
	});

	it("redirects uncaught root route errors to the generic error page", async () => {
		const replace = vi.fn();
		vi.stubGlobal("location", {
			pathname: "/applications",
			replace,
		});
		const ErrorComponent = (RootRoute as any).options?.errorComponent as
			| ComponentType<{ error: Error; reset: () => void }>
			| undefined;
		expect(ErrorComponent).toBeTypeOf("function");

		if (!ErrorComponent) {
			return;
		}

		render(
			createElement(ErrorComponent, {
				error: new Error("unexpected route failure"),
				reset: vi.fn(),
			})
		);

		await waitFor(() => {
			expect(replace).toHaveBeenCalledWith("/error?kind=unexpected");
		});
	});
});
