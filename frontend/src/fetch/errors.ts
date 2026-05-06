type HttpRequestErrorOptions = {
	code?: string;
	detail?: string;
	details?: unknown;
	message?: string;
	requestId?: string;
	responseData?: unknown;
	status: number;
};

export class HttpRequestError extends Error {
	public code?: string;
	public detail?: string;
	public details?: unknown;
	public requestId?: string;
	public responseData?: unknown;
	public status: number;

	public constructor({
		code,
		detail,
		details,
		message,
		requestId,
		responseData,
		status,
	}: HttpRequestErrorOptions) {
		super(message ?? detail ?? `Request failed with status ${status}`);
		this.name = "HttpRequestError";
		this.code = code;
		this.detail = detail;
		this.details = details;
		this.requestId = requestId;
		this.responseData = responseData;
		this.status = status;
	}
}

export class BadRequestError extends HttpRequestError {
	public constructor(options: Omit<HttpRequestErrorOptions, "status">) {
		super({ ...options, status: 400 });
		this.name = "BadRequestError";
	}
}

export class UnauthorizedRequestError extends HttpRequestError {
	public constructor(
		options: Partial<Omit<HttpRequestErrorOptions, "status">> = {}
	) {
		super({
			detail: options.detail,
			message: options.message ?? options.detail ?? "Unauthorized request",
			responseData: options.responseData,
			status: 401,
		});
		this.name = "UnauthorizedRequestError";
	}
}

export class ForbiddenRequestError extends HttpRequestError {
	public constructor(
		options: Partial<Omit<HttpRequestErrorOptions, "status">> = {}
	) {
		super({
			detail: options.detail,
			message: options.message ?? options.detail ?? "Forbidden request",
			responseData: options.responseData,
			status: 403,
		});
		this.name = "ForbiddenRequestError";
	}
}

export class ServerRequestError extends HttpRequestError {
	public constructor(options: HttpRequestErrorOptions) {
		super(options);
		this.name = "ServerRequestError";
	}
}

export const isUnauthorizedRequestError = (
	error: Error | null | undefined
): error is UnauthorizedRequestError =>
	error instanceof UnauthorizedRequestError;

export const isForbiddenRequestError = (
	error: Error | null | undefined
): error is ForbiddenRequestError => error instanceof ForbiddenRequestError;

export const isBadRequestError = (
	error: Error | null | undefined
): error is BadRequestError => error instanceof BadRequestError;

export const isServerRequestError = (
	error: Error | null | undefined
): error is ServerRequestError => error instanceof ServerRequestError;

export const getRequestErrorMessage = (
	error: unknown,
	fallbackMessage: string
): string => {
	if (error instanceof Error && error.message.trim().length > 0) {
		return error.message;
	}

	return fallbackMessage;
};
