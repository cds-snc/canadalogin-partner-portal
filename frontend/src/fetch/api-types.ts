export type ApiMessageResponse = Record<string, string>;

export type ApiErrorDetail = {
	code?: string;
	details?: unknown;
	message: string;
	requestId?: string;
};

export type ApiErrorResponse = {
	error: ApiErrorDetail;
};
