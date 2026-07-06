import { redirect } from "@tanstack/react-router";
import { getOidcLoginUrl, type UserRead } from "@/fetch/auth";
import { revalidateCurrentUser } from "./session-queries";
import { sanitizeAppPath } from "./login-search";

const defaultPostLoginPath = "/your-applications";

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
		window.location.assign(getOidcLoginUrl());
		throw new Error("Redirecting to OIDC login");
	}

	// Enforce terms acceptance before allowing access to any authenticated page.
	const targetPath = sanitizeAppPath(redirectTo, getPostLoginPath());
	const isOnboardingPath =
		targetPath.startsWith("/accept-terms") || targetPath.startsWith("/profile");

	if (!isOnboardingPath && currentUser.acceptedTermsAt == null) {
		throw redirect({
			replace: true,
			to: "/accept-terms",
			search: { redirect: targetPath },
		}) as unknown as Error;
	}

	// Enforce department selection for all first-time users.
	// Redirect to /profile/setup when department is not set (except when already on onboarding pages).
	if (
		!isOnboardingPath &&
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
			to: "/your-applications",
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
		window.location.assign(getOidcLoginUrl());
		throw new Error("Redirecting to OIDC login");
	}

	throw redirect({
		replace: true,
		to: targetPath,
	}) as unknown as Error;
};
