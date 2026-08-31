import { describe, expect, it } from "vitest";
import {
	BadRequestError,
	ForbiddenRequestError,
	ServerRequestError,
	UnauthorizedRequestError,
} from "@/fetch";
import { getRequestErrorNotice } from "@/fetch/error-notice";

describe("getRequestErrorNotice", () => {
	it("returns no notice for unauthorized errors because login redirect handles them", () => {
		expect(
			getRequestErrorNotice(new UnauthorizedRequestError(), {
				bodyKey: "roles.errorBody",
				titleKey: "roles.errorTitle",
			}),
		).toBeNull();
	});

	it("maps forbidden errors to a warning notice", () => {
		expect(
			getRequestErrorNotice(new ForbiddenRequestError(), {
				bodyKey: "roles.errorBody",
				titleKey: "roles.errorTitle",
			}),
		).toEqual({
			bodyKey: "errors.forbiddenBody",
			noticeRole: "warning",
			titleKey: "errors.forbiddenTitle",
		});
	});

	it("maps bad request errors to a warning notice", () => {
		expect(
			getRequestErrorNotice(new BadRequestError({ detail: "Invalid request" }), {
				bodyKey: "roles.errorBody",
				titleKey: "roles.errorTitle",
			}),
		).toEqual({
			bodyText: "Invalid request",
			bodyKey: "errors.badRequestBody",
			noticeRole: "warning",
			titleKey: "errors.badRequestTitle",
		});
	});

	it("maps server errors to a retry-later notice", () => {
		expect(
			getRequestErrorNotice(new ServerRequestError({ detail: "Down", status: 503 }), {
				bodyKey: "roles.errorBody",
				titleKey: "roles.errorTitle",
			}),
		).toEqual({
			bodyText: "Down",
			bodyKey: "errors.serverBody",
			noticeRole: "danger",
			titleKey: "errors.serverTitle",
		});
	});

	it("prefers the backend error message for forbidden notices too", () => {
		expect(
			getRequestErrorNotice(
				new ForbiddenRequestError({
					detail: "You do not have enough privileges.",
				}),
				{
					bodyKey: "roles.errorBody",
					titleKey: "roles.errorTitle",
				},
			),
		).toEqual({
			bodyText: "You do not have enough privileges.",
			bodyKey: "errors.forbiddenBody",
			noticeRole: "warning",
			titleKey: "errors.forbiddenTitle",
		});
	});

	it("falls back to the page-specific notice for unknown errors", () => {
		expect(
			getRequestErrorNotice(new Error("Unknown"), {
				bodyKey: "roles.errorBody",
				titleKey: "roles.errorTitle",
			}),
		).toEqual({
			bodyKey: "roles.errorBody",
			noticeRole: "danger",
			titleKey: "roles.errorTitle",
		});
	});
});