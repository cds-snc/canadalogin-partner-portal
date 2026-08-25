import { useCallback, useEffect, useRef, type RefObject } from "react";

type NavigationMode = "desktop" | "intermediate" | "mobile";

type NavigationDisclosureCoordinatorOptions = {
	languageKey: string;
	routeKey: string;
};

type NavigationDisclosureCoordinator = {
	closeOpenNavigation: (returnFocusToUserMenu?: boolean) => Promise<void>;
	topNavRef: RefObject<HTMLGcdsTopNavElement | null>;
	userNavGroupRef: RefObject<HTMLGcdsNavGroupElement | null>;
};

const getNavigationMode = (): NavigationMode => {
	if (window.innerWidth < 768) return "mobile";
	if (window.innerWidth < 1024) return "intermediate";
	return "desktop";
};

const isNavGroupOpen = (group: HTMLGcdsNavGroupElement): boolean =>
	group.open || group.hasAttribute("open");

export const useNavigationDisclosureCoordinator = ({
	languageKey,
	routeKey,
}: NavigationDisclosureCoordinatorOptions): NavigationDisclosureCoordinator => {
	const topNavRef = useRef<HTMLGcdsTopNavElement | null>(null);
	const userNavGroupRef = useRef<HTMLGcdsNavGroupElement | null>(null);
	const navigationModeRef = useRef<NavigationMode | null>(null);
	const closeQueueRef = useRef<Promise<void>>(Promise.resolve());

	const closeOpenNavigation = useCallback(
		async (returnFocusToUserMenu = false): Promise<void> => {
			const closeRequest = closeQueueRef.current.then(async () => {
				const groups = new Set<HTMLGcdsNavGroupElement>();
				const topNav = topNavRef.current;
				if (userNavGroupRef.current) groups.add(userNavGroupRef.current);
				for (const group of topNav?.querySelectorAll("gcds-nav-group") ?? []) {
					groups.add(group);
				}

				await Promise.all(
					[...groups].filter(isNavGroupOpen).map((group) => group.toggleNav())
				);

				const mobileGroup =
					topNav?.shadowRoot?.querySelector<HTMLGcdsNavGroupElement>(
						"gcds-nav-group.gcds-mobile-nav"
					);
				if (mobileGroup && isNavGroupOpen(mobileGroup)) {
					await mobileGroup.toggleNav();
				}
			});
			closeQueueRef.current = closeRequest.catch(() => undefined);
			await closeRequest;

			if (returnFocusToUserMenu) {
				await userNavGroupRef.current?.focusTrigger();
			}
		},
		[]
	);

	useEffect(() => {
		void closeOpenNavigation();
	}, [closeOpenNavigation, languageKey, routeKey]);

	useEffect(() => {
		navigationModeRef.current = getNavigationMode();
		const handleOutsideActivation = (event: PointerEvent): void => {
			const topNav = topNavRef.current;
			if (topNav && !event.composedPath().includes(topNav)) {
				void closeOpenNavigation();
			}
		};
		const handleFocusExit = (event: FocusEvent): void => {
			const eventPath = event.composedPath();
			const eventNavGroup = eventPath.find(
				(target): target is HTMLGcdsNavGroupElement =>
					target instanceof HTMLElement &&
					target.tagName === "GCDS-NAV-GROUP" &&
					!target.classList.contains("gcds-mobile-nav")
			);
			const userNavGroup = eventNavGroup ?? userNavGroupRef.current;
			if (
				!userNavGroup ||
				!eventPath.includes(userNavGroup) ||
				(event.relatedTarget instanceof Node &&
					userNavGroup.contains(event.relatedTarget))
			) {
				return;
			}

			event.stopImmediatePropagation();
			if (
				isNavGroupOpen(userNavGroup) &&
				typeof userNavGroup.toggleNav === "function"
			) {
				void userNavGroup.toggleNav();
			}
			void closeOpenNavigation();
		};
		const handleResize = (): void => {
			const nextMode = getNavigationMode();
			if (nextMode !== navigationModeRef.current) {
				navigationModeRef.current = nextMode;
				void closeOpenNavigation();
			}
		};

		document.addEventListener("pointerdown", handleOutsideActivation, true);
		document.addEventListener("focusout", handleFocusExit, true);
		window.addEventListener("resize", handleResize);
		return (): void => {
			document.removeEventListener(
				"pointerdown",
				handleOutsideActivation,
				true
			);
			document.removeEventListener("focusout", handleFocusExit, true);
			window.removeEventListener("resize", handleResize);
		};
	}, [closeOpenNavigation]);

	return { closeOpenNavigation, topNavRef, userNavGroupRef };
};
