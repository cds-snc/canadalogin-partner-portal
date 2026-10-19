import { toLoginHref } from "@/features/auth/login-search";
import { markBackendActivity } from "@/lib/backend-activity";
import type { ApiErrorDetail } from "./api-types";
import { buildApiUrl } from "./base-url";
import {
	BadRequestError,
	ForbiddenRequestError,
	HttpRequestError,
	ServerRequestError,
	UnauthorizedRequestError,
} from "./errors";

const unauthorizedPaths = new Set(["/auth-complete", "/login"]);
const forbiddenPaths = new Set(["/access-denied"]);
const errorPath = "/error?kind=unexpected";
const csrfCookieName = "csrftoken";
const csrfHeaderName = "x-csrftoken";
const safeMethods = new Set(["GET", "HEAD", "OPTIONS", "TRACE"]);

let csrfBootstrapPromise: Promise<string> | null = null;

type RequestJsonOptions = {
	redirectOnUnauthorized?: boolean;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === "object" && value !== null;

const readCsrfCookie = (): string | null => {
	if (typeof document === "undefined") {
		return null;
	}

	const cookiePrefix = `${csrfCookieName}=`;
	const cookie = document.cookie
		.split(";")
		.map((part) => part.trim())
		.find((part) => part.startsWith(cookiePrefix));

	return cookie ? decodeURIComponent(cookie.slice(cookiePrefix.length)) : null;
};

const getCsrfToken = async (): Promise<string> => {
	const existingToken = readCsrfCookie();
	if (existingToken) {
		return existingToken;
	}

	if (!csrfBootstrapPromise) {
		csrfBootstrapPromise = (async (): Promise<string> => {
			const response = await fetch(buildApiUrl("/api/v1/csrf"), {
				cache: "no-store",
				credentials: "include",
				headers: { Accept: "application/json" },
				method: "GET",
			});

			if (!response.ok) {
				throw new Error("Unable to retrieve CSRF token");
			}

			const token = readCsrfCookie();
			if (!token) {
				throw new Error("CSRF token cookie was not set");
			}

			return token;
		})();
	}

	const bootstrapPromise = csrfBootstrapPromise;
	try {
		return await bootstrapPromise;
	} finally {
		if (csrfBootstrapPromise === bootstrapPromise) {
			csrfBootstrapPromise = null;
		}
	}
};

const parseResponseData = async (response: Response): Promise<unknown> => {
	const responseContentType = response.headers?.get?.("content-type");

	if (responseContentType && responseContentType.includes("application/json")) {
		try {
			// `Response.json()` is typed as `any` by lib.dom; cast to `unknown`
			// so callers must explicitly narrow before use.

			const raw = await response.json();
			return raw;
		} catch {
			return null;
		}
	}

	if (typeof response.json !== "function") {
		return null;
	}

	try {
		// `Response.json()` is typed as `any` by lib.dom; cast to `unknown`
		// so callers must explicitly narrow before use.

		const raw = await response.json();
		return raw;
	} catch {
		return null;
	}
};

const getApiErrorDetail = (responseData: unknown): ApiErrorDetail | null => {
	if (!isRecord(responseData)) {
		return null;
	}

	const error = responseData["error"];
	if (!isRecord(error)) {
		return null;
	}

	const message = error["message"];
	if (typeof message !== "string" || message.trim().length === 0) {
		return null;
	}

	const code = error["code"];
	const requestId = error["requestId"];

	return {
		code: typeof code === "string" ? code : undefined,
		details: error["details"],
		message,
		requestId: typeof requestId === "string" ? requestId : undefined,
	};
};

const getLegacyErrorDetail = (responseData: unknown): string | undefined => {
	if (!isRecord(responseData)) {
		return undefined;
	}

	const detail = responseData["detail"];

	if (typeof detail === "string" && detail.trim().length > 0) {
		return detail;
	}

	if (isRecord(detail)) {
		const message = detail["message"];
		if (typeof message === "string" && message.trim().length > 0) {
			return message;
		}
	}

	return undefined;
};

const redirectToLogin = (): void => {
	const location = globalThis.location;

	if (!location || unauthorizedPaths.has(location.pathname)) {
		return;
	}

	location.replace(
		toLoginHref({
			message: "session-expired",
			reason: "unauthorized",
			redirect: location.pathname,
		})
	);
};

const redirectToAccessDenied = (): void => {
	const location = globalThis.location;

	if (!location || forbiddenPaths.has(location.pathname)) {
		return;
	}

	location.replace("/access-denied");
};

const redirectToUnexpectedError = (): void => {
	const location = globalThis.location;

	if (!location || location.pathname === "/error") {
		return;
	}

	location.replace(errorPath);
};

const toRequestError = (
	status: number,
	responseData: unknown
): HttpRequestError => {
	const apiErrorDetail = getApiErrorDetail(responseData);
	const detail = apiErrorDetail?.message ?? getLegacyErrorDetail(responseData);
	const errorOptions = {
		code: apiErrorDetail?.code,
		detail,
		details: apiErrorDetail?.details,
		requestId: apiErrorDetail?.requestId,
		responseData,
	};

	if (status === 400) {
		return new BadRequestError(errorOptions);
	}

	if (status === 401) {
		return new UnauthorizedRequestError(errorOptions);
	}

	if (status === 403) {
		return new ForbiddenRequestError(errorOptions);
	}

	if (status >= 500) {
		return new ServerRequestError({ ...errorOptions, status });
	}

	return new HttpRequestError({ ...errorOptions, status });
};

export const requestJson = async <ResponseType>(
	path: string,
	requestInit: RequestInit,
	options: RequestJsonOptions = {}
): Promise<ResponseType | null> => {
	let response: Response;

	try {
		const method = (requestInit.method ?? "GET").toUpperCase();
		const headers = new Headers({
			Accept: "application/json",
			"Content-Type": "application/json",
		});
		new Headers(requestInit.headers).forEach((value, key) => {
			headers.set(key, value);
		});

		if (!safeMethods.has(method) && !headers.has(csrfHeaderName)) {
			headers.set(csrfHeaderName, await getCsrfToken());
		}

		response = await fetch(buildApiUrl(path), {
			...requestInit,
			credentials: requestInit.credentials ?? "include",
			headers,
		});
	} catch (error) {
		if (!(error instanceof Error && error.name === "AbortError")) {
			redirectToUnexpectedError();
		}
		throw error;
	}

	if (response.status === 204) {
		markBackendActivity();
		return null;
	}

	// parseResponseData may call Response.json() which is typed as `any` by lib.dom;
	// narrow to `unknown` here intentionally before further checks.

	const responseData: unknown = await parseResponseData(response);

	if (!response.ok) {
		const requestError = toRequestError(response.status, responseData);

		if (requestError instanceof ServerRequestError) {
			redirectToUnexpectedError();
		}

		if (
			requestError instanceof UnauthorizedRequestError &&
			options.redirectOnUnauthorized !== false
		) {
			redirectToLogin();
		}

		if (
			requestError instanceof ForbiddenRequestError &&
			getApiErrorDetail(responseData)?.code !== "csrf_error"
		) {
			redirectToAccessDenied();
		}

		throw requestError;
	}

	if (responseData === null) {
		markBackendActivity();
		return null;
	}

	markBackendActivity();

	return responseData as ResponseType;
};
