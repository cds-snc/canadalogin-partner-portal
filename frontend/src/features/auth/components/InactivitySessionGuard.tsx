import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { FunctionComponent } from "@/common/types";
import { Button, Modal, Text } from "@/components/ui";
import { useSession } from "@/hooks";
import {
	getLastBackendActivityAt,
	subscribeToBackendActivity,
} from "@/lib/backend-activity";
import { inactivityTimeoutConfig } from "../inactivity-timeout-config";

const closeDisabled = (): void => {
	// The user must choose to continue or sign out.
};

const formatCountdown = (totalSeconds: number): string => {
	const minutes = Math.floor(totalSeconds / 60);
	const seconds = totalSeconds % 60;
	return `${minutes}:${String(seconds).padStart(2, "0")}`;
};

export const InactivitySessionGuard = (): FunctionComponent => {
	const { t } = useTranslation();
	const { isAuthenticated, isLoading, refreshSession } = useSession();
	const [nowMs, setNowMs] = useState<number>(() => Date.now());
	const [isContinuing, setIsContinuing] = useState(false);
	const [isLoggingOut, setIsLoggingOut] = useState(false);
	const hasTriggeredAutoLogoutRef = useRef(false);

	const performLogout = useCallback((): void => {
		hasTriggeredAutoLogoutRef.current = false;
		setIsLoggingOut(false);
		window.location.href = "/logout";
	}, []);

	useEffect(() => {
		if (!isAuthenticated || isLoading) {
			hasTriggeredAutoLogoutRef.current = false;
			return;
		}

		const syncNow = (): void => {
			setNowMs(Date.now());
		};

		syncNow();
		const intervalId = globalThis.setInterval(syncNow, 1000);
		const unsubscribe = subscribeToBackendActivity(syncNow);

		return (): void => {
			globalThis.clearInterval(intervalId);
			unsubscribe();
		};
	}, [isAuthenticated, isLoading]);

	const warningState = useMemo((): {
		countdownSeconds: number;
		isWarningVisible: boolean;
		shouldAutoLogout: boolean;
	} => {
		if (!isAuthenticated || isLoading) {
			return {
				countdownSeconds: 0,
				isWarningVisible: false,
				shouldAutoLogout: false,
			};
		}

		const lastBackendActivityAt = getLastBackendActivityAt();
		if (lastBackendActivityAt === null) {
			return {
				countdownSeconds: 0,
				isWarningVisible: false,
				shouldAutoLogout: false,
			};
		}

		const { countdownMs, warningAfterMs } = inactivityTimeoutConfig;
		const inactivityDuration = nowMs - lastBackendActivityAt;

		if (inactivityDuration < warningAfterMs) {
			return {
				countdownSeconds: 0,
				isWarningVisible: false,
				shouldAutoLogout: false,
			};
		}

		const warningDeadlineMs =
			lastBackendActivityAt + warningAfterMs + countdownMs;
		return {
			countdownSeconds: Math.max(
				0,
				Math.ceil((warningDeadlineMs - nowMs) / 1000)
			),
			isWarningVisible: true,
			shouldAutoLogout: nowMs >= warningDeadlineMs,
		};
	}, [isAuthenticated, isLoading, nowMs]);

	useEffect(() => {
		if (!warningState.shouldAutoLogout) {
			return;
		}

		if (!hasTriggeredAutoLogoutRef.current) {
			hasTriggeredAutoLogoutRef.current = true;
			setIsLoggingOut(true);
			performLogout();
		}
	}, [performLogout, warningState.shouldAutoLogout]);

	const handleContinueSession = useCallback(async (): Promise<void> => {
		if (isContinuing || isLoggingOut) {
			return;
		}

		setIsContinuing(true);

		try {
			const currentUser = await refreshSession();

			if (!currentUser) {
				setIsLoggingOut(true);
				performLogout();
				return;
			}

			hasTriggeredAutoLogoutRef.current = false;
			setNowMs(Date.now());
		} catch {
			setIsLoggingOut(true);
			performLogout();
		} finally {
			setIsContinuing(false);
		}
	}, [isContinuing, isLoggingOut, performLogout, refreshSession]);

	const handleLogout = useCallback((): void => {
		if (isLoggingOut) {
			return;
		}

		setIsLoggingOut(true);
		performLogout();
	}, [isLoggingOut, performLogout]);

	if (!isAuthenticated || !warningState.isWarningVisible) {
		return null;
	}

	const footer = (
		<>
			<Button
				buttonRole="secondary"
				disabled={isContinuing || isLoggingOut}
				type="button"
				onGcdsClick={() => {
					void handleContinueSession();
				}}
			>
				{isContinuing
					? t("sessionTimeout.continuingAction")
					: t("sessionTimeout.continueAction")}
			</Button>
			<Button
				buttonRole="danger"
				disabled={isLoggingOut}
				type="button"
				onGcdsClick={handleLogout}
			>
				{isLoggingOut
					? t("sessionTimeout.loggingOutAction")
					: t("sessionTimeout.logoutAction")}
			</Button>
		</>
	);

	return (
		<Modal
			isOpen
			description={t("sessionTimeout.warningDescription")}
			footer={footer}
			title={t("sessionTimeout.warningTitle")}
			onClose={closeDisabled}
		>
			<Text ariaLive="polite" marginBottom="0">
				{t("sessionTimeout.countdownLabel", {
					time: formatCountdown(warningState.countdownSeconds),
				})}
			</Text>
		</Modal>
	);
};
