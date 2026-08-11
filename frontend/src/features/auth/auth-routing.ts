import { redirect } from "@tanstack/react-router";
import { getOidcLoginUrl, type UserRead } from "@/fetch/auth";
import { normalizeLanguageCode } from "@/common/language";
import { appPreferencesStore } from "@/store/app-preferences-store";
import { revalidateCurrentUser } from "./session-queries";
import { sanitizeAppPath } from "./login-search";

const defaultPostLoginPath = "/your-applications";

export const getPostLoginPath = (): string =>
	sanitizeAppPath(
		import.meta.env.VITE_AUTH_POST_LOGIN_PATH,
		defaultPostLoginPath
	);

const redirectToOidcLogin = (targetPath: string): never => {
	window.location.assign(getOidcLoginUrl(undefined, targetPath));
	throw new Error("Redirecting to OIDC login");
};

const requireAuthenticatedUserInternal = async (
	redirectTo: string,
	options?: { skipDepartmentSelection?: boolean }
): Promise<UserRead> => {
	let currentUser: UserRead | null;

	try {
		currentUser = await revalidateCurrentUser();
	} catch {
		currentUser = null;
	}

	const targetPath = sanitizeAppPath(redirectTo, getPostLoginPath());

	if (!currentUser) {
		return redirectToOidcLogin(targetPath);
	}

	// Enforce terms acceptance before allowing access to any authenticated page.
	const isOnboardingPath =
		targetPath.startsWith("/accept-terms") || targetPath.startsWith("/profile");

	if (!isOnboardingPath && currentUser.acceptedTermsAt == null) {
		throw redirect({
			replace: true,
			to: "/accept-terms",
			search: { redirect: targetPath },
		}) as unknown as Error;
	}

	// Enforce department selection for authenticated application routes unless a
	// page intentionally needs to bypass that flow, such as invitation acceptance.
	if (
		!options?.skipDepartmentSelection &&
		!isOnboardingPath &&
		currentUser.hasPartnerAccessGrant !== true &&
		(currentUser.departmentAbbreviation == null ||
			currentUser.departmentAbbreviation === "")
	) {
		throw redirect({ replace: true, to: "/profile/setup" }) as unknown as Error;
	}

	return currentUser;
};

export { sanitizeAppPath } from "./login-search";

export const requireAuthenticatedUser = async (
	redirectTo: string
): Promise<UserRead> => requireAuthenticatedUserInternal(redirectTo);

export const requireAuthenticatedUserWithoutDepartmentSelection = async (
	redirectTo: string
): Promise<UserRead> =>
	requireAuthenticatedUserInternal(redirectTo, {
		skipDepartmentSelection: true,
	});

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
	redirectTo?: string,
	uiLocales?: string
): Promise<never> => {
	const currentUser = await revalidateCurrentUser();
	const targetPath = sanitizeAppPath(redirectTo, getPostLoginPath());

	if (!currentUser) {
		const { language } = appPreferencesStore.getState();
		window.location.assign(getOidcLoginUrl(language, targetPath));
		throw new Error("Redirecting to OIDC login");
	}

	if (uiLocales) {
		await appPreferencesStore
			.getState()
			.setLanguage(normalizeLanguageCode(uiLocales));
	}

	throw redirect({
		replace: true,
		to: targetPath,
	}) as unknown as Error;
};
