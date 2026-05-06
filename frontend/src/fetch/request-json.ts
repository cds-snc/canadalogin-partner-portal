import { toLoginHref } from "@/features/auth/login-search";
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

type RequestJsonOptions = {
	redirectOnUnauthorized?: boolean;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === "object" && value !== null;

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
	const response = await fetch(buildApiUrl(path), {
		...requestInit,
		credentials: requestInit.credentials ?? "include",
		headers: {
			Accept: "application/json",
			"Content-Type": "application/json",
			...(requestInit.headers ?? {}),
		},
	});

	if (response.status === 204) {
		return null;
	}

	// parseResponseData may call Response.json() which is typed as `any` by lib.dom;
	// narrow to `unknown` here intentionally before further checks.

	const responseData: unknown = await parseResponseData(response);

	if (!response.ok) {
		const requestError = toRequestError(response.status, responseData);

		if (
			requestError instanceof UnauthorizedRequestError &&
			options.redirectOnUnauthorized !== false
		) {
			redirectToLogin();
		}

		throw requestError;
	}

	if (responseData === null) {
		return null;
	}

	return responseData as ResponseType;
};
