import {
	isBadRequestError,
	isForbiddenRequestError,
	isServerRequestError,
	isUnauthorizedRequestError,
} from "./errors";

type RequestErrorFallback = {
	bodyKey: string;
	titleKey: string;
};

export type RequestErrorNotice = RequestErrorFallback & {
	bodyText?: string;
	noticeRole: "danger" | "warning";
};

export const getRequestErrorNotice = (
	error: Error | null | undefined,
	fallback: RequestErrorFallback
): RequestErrorNotice | null => {
	if (!error || isUnauthorizedRequestError(error)) {
		return null;
	}

	if (isForbiddenRequestError(error)) {
		return {
			bodyText: error.detail,
			bodyKey: "errors.forbiddenBody",
			noticeRole: "warning",
			titleKey: "errors.forbiddenTitle",
		};
	}

	if (isBadRequestError(error)) {
		return {
			bodyText: error.detail,
			bodyKey: "errors.badRequestBody",
			noticeRole: "warning",
			titleKey: "errors.badRequestTitle",
		};
	}

	if (isServerRequestError(error)) {
		return {
			bodyText: error.detail,
			bodyKey: "errors.serverBody",
			noticeRole: "danger",
			titleKey: "errors.serverTitle",
		};
	}

	return {
		...fallback,
		noticeRole: "danger",
	};
};
