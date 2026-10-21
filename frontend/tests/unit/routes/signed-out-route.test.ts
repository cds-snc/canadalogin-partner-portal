import { describe, expect, it } from "vitest";
import i18n from "@/common/i18n";
import { Route } from "@/routes/signed-out";

describe("signed out route", (): void => {
	it("renders publicly and maps only session-expired state to the expired experience", (): void => {
		expect(Route.options?.beforeLoad).toBeTypeOf("function");

		const validateSearch = (Route as any).options?.validateSearch;
		expect(validateSearch).toBeTypeOf("function");
		expect(
			validateSearch({
				state: "session-expired.gbyIYC0bnvTp9NcaIJi-uxMFeu6P9MpP",
			})
		).toEqual({
			state: "session-expired.gbyIYC0bnvTp9NcaIJi-uxMFeu6P9MpP",
		});
		expect(validateSearch({ state: "manual" })).toEqual({ state: undefined });
		expect(validateSearch({})).toEqual({ state: undefined });
	});

	it("provides the home breadcrumb shown in the signed-out design", (): void => {
		const beforeLoad = Route.options?.beforeLoad as (() => unknown) | undefined;

		expect(beforeLoad?.()).toEqual({
			backLink: {
				href: "/",
				label: i18n.t("nav.home"),
				showBackLabel: false,
			},
		});
	});
});