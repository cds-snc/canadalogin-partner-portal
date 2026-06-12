import { requestJson } from "@/fetch";
import type { ApiMessageResponse } from "./api-types";

export const acceptTerms = async (): Promise<ApiMessageResponse | null> =>
	requestJson<ApiMessageResponse>("/api/v1/user/me/accept-terms", {
		method: "PATCH",
	});
