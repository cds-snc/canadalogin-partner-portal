import { requestJson } from "@/fetch";
import type { UserRead } from "./auth";

export type UserTierRead = UserRead & {
	tierName: string;
	tierCreatedAt: string;
	tierUuid: string;
};

export const getUserTier = async (
	userUuid: string,
): Promise<UserTierRead | null> =>
	requestJson<UserTierRead>(`/api/v1/user/${encodeURIComponent(userUuid)}/tier`, {
		method: "GET",
	});