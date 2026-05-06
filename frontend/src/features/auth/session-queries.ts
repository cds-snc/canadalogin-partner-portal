import { authStore } from "@/store";
import type { UserRead } from "@/fetch/auth";

export const revalidateCurrentUser = async (): Promise<UserRead | null> =>
	authStore.getState().refreshSession();
