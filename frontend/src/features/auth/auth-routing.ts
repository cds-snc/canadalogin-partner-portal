import { redirect } from "@tanstack/react-router";
import { getOidcLoginUrl, type UserRead } from "@/fetch/auth";
import {
	getAccessibleRPApplication,
	type AccessibleRPApplicationRead,
} from "@/fetch/rp-applications";
import { normalizeLanguageCode } from "@/common/language";
import { appPreferencesStore } from "@/store/app-preferences-store";
import { revalidateCurrentUser } from "./session-queries";
import { sanitizeAppPath } from "./login-search";
import {
	findRouteByPath,
	isRouteVisible,
} from "@/features/navigation/route-catalog";
import {
	canReadApplicationInformation,
	canReadRPApplication,
	canReadWorkspace,
	getPartnerAccessForWorkspace,
	hasCapability,
	hasPartnerAccess,
	roleAllows,
	type AuthorizationContext,
	type Capability,
} from "./authorization";

// Before the user's canonical authorization context is known, return to the
// neutral entry route. The authenticated entry guard then selects a role-aware
// landing page instead of assuming partner access.
const defaultPostLoginPath = "/";

export const getPostLoginPath = (): string =>
	sanitizeAppPath(
		import.meta.env.VITE_AUTH_POST_LOGIN_PATH,
		defaultPostLoginPath
	);

export const getAuthorizationLandingPath = (
	authorizationContext: AuthorizationContext
): string =>
	hasPartnerAccess(authorizationContext) ||
	canReadWorkspace(authorizationContext) ||
	hasCapability(authorizationContext, "onboarding_oversight_read") ||
	hasCapability(authorizationContext, "platform_governance")
		? "/"
		: "/access-denied";

const AUTHENTICATED_ONBOARDING_PATHS = [
	"/accept-terms",
	"/invitations/rp-applications",
	"/profile/setup",
] as const;

const AUTHENTICATED_COMPATIBILITY_PATHS = ["/your-applications"] as const;

const isTokenizedInvitationPath = (path: string): boolean =>
	path.startsWith("/invitations/rp-applications/");

export const getAuthorizedPostLoginPath = (
	currentUser: UserRead,
	intendedDestination?: string
): string => {
	const landingPath = getAuthorizationLandingPath(
		currentUser.authorizationContext
	);
	const sanitizedPath = sanitizeAppPath(intendedDestination, landingPath);

	if (isTokenizedInvitationPath(sanitizedPath)) {
		return sanitizedPath;
	}

	if (landingPath === "/access-denied") {
		return landingPath;
	}

	const route = findRouteByPath(sanitizedPath);
	if (route) {
		return isRouteVisible(route, currentUser.authorizationContext)
			? sanitizedPath
			: landingPath;
	}

	if (
		AUTHENTICATED_COMPATIBILITY_PATHS.some(
			(pathPrefix) =>
				sanitizedPath === pathPrefix ||
				sanitizedPath.startsWith(`${pathPrefix}/`)
		)
	) {
		return sanitizedPath;
	}

	return AUTHENTICATED_ONBOARDING_PATHS.some(
		(pathPrefix) =>
			sanitizedPath === pathPrefix || sanitizedPath.startsWith(`${pathPrefix}/`)
	)
		? sanitizedPath
		: landingPath;
};

const redirectToOidcLogin = (targetPath: string): never => {
	window.location.assign(getOidcLoginUrl(undefined, targetPath));
	throw new Error("Redirecting to OIDC login");
};

const enforceAuthenticatedPrerequisites = (
	currentUser: UserRead,
	targetPath: string,
	options?: { skipDepartmentSelection?: boolean }
): UserRead => {
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
		!hasPartnerAccess(currentUser.authorizationContext) &&
		(currentUser.departmentAbbreviation == null ||
			currentUser.departmentAbbreviation === "")
	) {
		throw redirect({ replace: true, to: "/profile/setup" }) as unknown as Error;
	}

	return currentUser;
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

	return enforceAuthenticatedPrerequisites(currentUser, targetPath, options);
};

export const loadHomeAdmission = async (
	intendedDestination?: string
): Promise<UserRead | null> => {
	let currentUser: UserRead | null;

	try {
		currentUser = await revalidateCurrentUser();
	} catch {
		// The public Home is the safe fallback when the BFF cannot confirm a
		// session. The auth store clears stale session state on this failure.
		return null;
	}

	if (!currentUser) {
		return null;
	}

	const sanitizedDestination = sanitizeAppPath(intendedDestination, "/");
	const admittedUser = enforceAuthenticatedPrerequisites(
		currentUser,
		sanitizedDestination,
		{ skipDepartmentSelection: isTokenizedInvitationPath(sanitizedDestination) }
	);
	const destination = getAuthorizedPostLoginPath(
		admittedUser,
		sanitizedDestination
	);

	if (destination === "/") {
		return admittedUser;
	}

	throw redirect({ replace: true, to: destination }) as unknown as Error;
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

const requireAuthorization = async (
	redirectTo: string,
	isAllowed: (currentUser: UserRead) => boolean
): Promise<UserRead> => {
	const currentUser = await requireAuthenticatedUser(redirectTo);

	if (!isAllowed(currentUser)) {
		throw redirect({
			replace: true,
			to: "/access-denied",
		}) as unknown as Error;
	}

	return currentUser;
};

export const requireCapability = async (
	redirectTo: string,
	capability: Capability,
	workspaceUuid?: string
): Promise<UserRead> =>
	requireAuthorization(redirectTo, (currentUser) =>
		hasCapability(currentUser.authorizationContext, capability, workspaceUuid)
	);

export const requireAnyCapability = async (
	redirectTo: string,
	capabilities: ReadonlyArray<Capability>
): Promise<UserRead> =>
	requireAuthorization(redirectTo, (currentUser) =>
		capabilities.some((capability) =>
			hasCapability(currentUser.authorizationContext, capability)
		)
	);

export const requirePartnerAccess = async (
	redirectTo: string
): Promise<UserRead> =>
	requireAuthorization(redirectTo, (currentUser) =>
		hasPartnerAccess(currentUser.authorizationContext)
	);

export const requireWorkspaceRead = async (
	redirectTo: string,
	workspaceUuid?: string
): Promise<UserRead> =>
	requireAuthorization(redirectTo, (currentUser) =>
		canReadWorkspace(currentUser.authorizationContext, workspaceUuid)
	);

export const requireApplicationInformationRead = async (
	redirectTo: string,
	workspaceUuid: string
): Promise<UserRead> =>
	requireAuthorization(redirectTo, (currentUser) =>
		canReadApplicationInformation(
			currentUser.authorizationContext,
			workspaceUuid
		)
	);

export const requireRPApplicationRead = async (
	redirectTo: string,
	workspaceUuid: string
): Promise<UserRead> =>
	requireAuthorization(redirectTo, (currentUser) =>
		canReadRPApplication(currentUser.authorizationContext, workspaceUuid)
	);

export const requireAccessibleRPApplicationCapability = async (
	redirectTo: string,
	rpApplicationUuid: string,
	capability: Capability
): Promise<{
	application: AccessibleRPApplicationRead;
	currentUser: UserRead;
}> => {
	const currentUser = await requirePartnerAccess(redirectTo);
	const application = await getAccessibleRPApplication(rpApplicationUuid);
	const sessionAccess = getPartnerAccessForWorkspace(
		currentUser.authorizationContext,
		application.workspaceUuid
	);

	if (
		sessionAccess?.role !== application.role ||
		!roleAllows(application.role, capability)
	) {
		throw redirect({ replace: true, to: "/access-denied" }) as unknown as Error;
	}

	return { application, currentUser };
};

export const completeLoginRedirect = async (
	redirectTo?: string,
	uiLocales?: string
): Promise<never> => {
	const currentUser = await revalidateCurrentUser();

	if (!currentUser) {
		const targetPath = sanitizeAppPath(redirectTo, getPostLoginPath());
		const { language } = appPreferencesStore.getState();
		window.location.assign(getOidcLoginUrl(language, targetPath));
		throw new Error("Redirecting to OIDC login");
	}

	const sanitizedDestination = sanitizeAppPath(redirectTo, getPostLoginPath());
	const admittedUser = enforceAuthenticatedPrerequisites(
		currentUser,
		sanitizedDestination,
		{ skipDepartmentSelection: isTokenizedInvitationPath(sanitizedDestination) }
	);
	const targetPath = getAuthorizedPostLoginPath(
		admittedUser,
		sanitizedDestination
	);

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
