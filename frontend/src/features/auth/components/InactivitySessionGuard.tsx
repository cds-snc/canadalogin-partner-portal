import { useNavigate } from "@tanstack/react-router";
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
	const navigate = useNavigate();
	const { isAuthenticated, isLoading, logout, refreshSession } = useSession();
	const [nowMs, setNowMs] = useState<number>(() => Date.now());
	const [warningDeadlineMs, setWarningDeadlineMs] = useState<number | null>(
		null
	);
	const [isContinuing, setIsContinuing] = useState(false);
	const [isLoggingOut, setIsLoggingOut] = useState(false);
	const hasTriggeredAutoLogoutRef = useRef(false);

	const performLogout = useCallback(async (): Promise<void> => {
		try {
			await logout();
			await navigate({ replace: true, to: "/" });
		} finally {
			hasTriggeredAutoLogoutRef.current = false;
			setWarningDeadlineMs(null);
			setIsLoggingOut(false);
		}
	}, [logout, navigate]);

	useEffect(() => {
		if (!isAuthenticated || isLoading) {
			hasTriggeredAutoLogoutRef.current = false;
			setWarningDeadlineMs(null);
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

	useEffect(() => {
		if (!isAuthenticated || isLoading) {
			return;
		}

		const lastBackendActivityAt = getLastBackendActivityAt();
		if (lastBackendActivityAt === null) {
			if (warningDeadlineMs !== null) {
				setWarningDeadlineMs(null);
			}
			return;
		}

		const inactivityDuration = nowMs - lastBackendActivityAt;
		const { countdownMs, warningAfterMs } = inactivityTimeoutConfig;

		if (warningDeadlineMs === null) {
			if (inactivityDuration >= warningAfterMs) {
				setWarningDeadlineMs(nowMs + countdownMs);
			}
			return;
		}

		if (inactivityDuration < warningAfterMs) {
			setWarningDeadlineMs(null);
			return;
		}

		if (nowMs >= warningDeadlineMs && !hasTriggeredAutoLogoutRef.current) {
			hasTriggeredAutoLogoutRef.current = true;
			setIsLoggingOut(true);
			void performLogout();
		}
	}, [isAuthenticated, isLoading, nowMs, performLogout, warningDeadlineMs]);

	const handleContinueSession = useCallback(async (): Promise<void> => {
		if (isContinuing || isLoggingOut) {
			return;
		}

		setIsContinuing(true);

		try {
			const currentUser = await refreshSession();

			if (!currentUser) {
				setIsLoggingOut(true);
				await performLogout();
				return;
			}

			hasTriggeredAutoLogoutRef.current = false;
			setWarningDeadlineMs(null);
			setNowMs(Date.now());
		} catch {
			setIsLoggingOut(true);
			await performLogout();
		} finally {
			setIsContinuing(false);
		}
	}, [isContinuing, isLoggingOut, performLogout, refreshSession]);

	const handleLogout = useCallback((): void => {
		if (isLoggingOut) {
			return;
		}

		setIsLoggingOut(true);
		void performLogout();
	}, [isLoggingOut, performLogout]);

	const countdownSeconds = useMemo((): number => {
		if (warningDeadlineMs === null) {
			return 0;
		}

		return Math.max(0, Math.ceil((warningDeadlineMs - nowMs) / 1000));
	}, [nowMs, warningDeadlineMs]);

	if (!isAuthenticated || warningDeadlineMs === null) {
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
					time: formatCountdown(countdownSeconds),
				})}
			</Text>
		</Modal>
	);
};
