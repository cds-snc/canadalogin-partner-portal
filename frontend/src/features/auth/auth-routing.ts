import { redirect } from "@tanstack/react-router";
import type { UserRead } from "@/fetch/auth";
import { revalidateCurrentUser } from "./session-queries";
import { buildLoginLocation, sanitizeAppPath } from "./login-search";

const defaultPostLoginPath = "/dashboard";

export const getPostLoginPath = (): string =>
	sanitizeAppPath(
		import.meta.env.VITE_AUTH_POST_LOGIN_PATH,
		defaultPostLoginPath
	);

export { sanitizeAppPath } from "./login-search";

export const requireAuthenticatedUser = async (
	redirectTo: string
): Promise<UserRead> => {
	let currentUser: UserRead | null;

	try {
		currentUser = await revalidateCurrentUser();
	} catch {
		currentUser = null;
	}

	if (!currentUser) {
		// TanStack Router uses thrown redirect objects to short-circuit route loading.
		throw redirect({
			replace: true,
			...buildLoginLocation({
				redirect: sanitizeAppPath(redirectTo, getPostLoginPath()),
			}),
		}) as unknown as Error;
	}

	// Enforce department selection for all first-time users.
	// Redirect to /profile/setup when department is not set (except when already on profile pages).
	const targetPath = sanitizeAppPath(redirectTo, getPostLoginPath());
	const isProfilePath = targetPath.startsWith("/profile");

	if (
		!isProfilePath &&
		(currentUser.departmentAbbreviation == null ||
			currentUser.departmentAbbreviation === "")
	) {
		// Redirect to the dedicated profile setup page so first-time users
		// select their department from a focused flow.
		throw redirect({ replace: true, to: "/profile/setup" }) as unknown as Error;
	}

	return currentUser;
};

export const requireSuperuser = async (
	redirectTo: string
): Promise<UserRead> => {
	const currentUser = await requireAuthenticatedUser(redirectTo);

	if (!currentUser.isSuperuser) {
		throw redirect({
			replace: true,
			to: "/dashboard",
		}) as unknown as Error;
	}

	return currentUser;
};

export const redirectAuthenticatedUser = async (
	redirectTo?: string
): Promise<void> => {
	const currentUser = await revalidateCurrentUser();

	if (currentUser) {
		throw redirect({
			replace: true,
			to: sanitizeAppPath(redirectTo, getPostLoginPath()),
		}) as unknown as Error;
	}
};

export const completeLoginRedirect = async (
	redirectTo?: string
): Promise<never> => {
	const currentUser = await revalidateCurrentUser();
	const targetPath = sanitizeAppPath(redirectTo, getPostLoginPath());

	if (!currentUser) {
		throw redirect({
			replace: true,
			...buildLoginLocation({ redirect: targetPath }),
		}) as unknown as Error;
	}

	throw redirect({
		replace: true,
		to: targetPath,
	}) as unknown as Error;
};
