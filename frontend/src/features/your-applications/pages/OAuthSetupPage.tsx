import { useParams } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import type { FunctionComponent } from "@/common/types";
import { Card, Details, Heading, Notice, Text } from "@/components/ui";
import { HttpRequestError } from "@/fetch/errors";
import {
	getCurrentUserRPOAuthSetup,
	type CurrentUserRPOAuthSetupRead,
} from "@/fetch/rp-applications";

const statusBadgeColors: Record<string, string> = {
	active:
		"border-[var(--gcds-color-green-200)] bg-[var(--gcds-color-green-50)] text-[var(--gcds-color-green-900)]",
	inactive:
		"border-[var(--gcds-border-default)] bg-[var(--gcds-color-neutral-100)] text-[var(--gcds-text-secondary)]",
};

const StatusBadge = ({ status }: { status: string }): ReactNode => {
	const normalized = status.trim().toLowerCase() || "unknown";
	const colorClass =
		statusBadgeColors[normalized] ??
		"border-[var(--gcds-border-default)] bg-[var(--gcds-color-neutral-100)] text-[var(--gcds-text-secondary)]";
	return (
		<span
			className={`inline-block rounded-full border px-200 py-100 text-sm font-medium ${colorClass}`}
		>
			{normalized}
		</span>
	);
};

export const OAuthSetupPage = (): FunctionComponent => {
	const { rpApplicationUuid } = useParams({
		from: "/your-applications/$rpApplicationUuid",
	});
	const { i18n, t } = useTranslation();

	const [oauthSetup, setOauthSetup] =
		useState<CurrentUserRPOAuthSetupRead | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	useEffect((): (() => void) => {
		let isMounted = true;

		const loadOAuthSetup = async (): Promise<void> => {
			try {
				const response = await getCurrentUserRPOAuthSetup(rpApplicationUuid);
				if (!isMounted) {
					return;
				}
				setOauthSetup(response);
				setIsLoading(false);
			} catch (error) {
				if (!isMounted) {
					return;
				}

				if (error instanceof HttpRequestError && error.status === 403) {
					globalThis.location.replace("/access-denied");
					return;
				}
				if (error instanceof HttpRequestError && error.status === 404) {
					globalThis.location.replace("/error?kind=not_found");
					return;
				}
				if (
					error instanceof HttpRequestError &&
					error.status === 409 &&
					error.code === "rp_application_department_required"
				) {
					globalThis.location.replace(
						`/your-applications/${rpApplicationUuid}/department-setup`
					);
					return;
				}

				globalThis.location.replace("/error?kind=unexpected");
			}
		};

		void loadOAuthSetup();

		return () => {
			isMounted = false;
		};
	}, [rpApplicationUuid]);

	const redirectUris = useMemo(
		() => oauthSetup?.redirectUris ?? [],
		[oauthSetup?.redirectUris]
	);
	const logoutRedirectUris = useMemo(
		() => oauthSetup?.logoutRedirectUris ?? [],
		[oauthSetup?.logoutRedirectUris]
	);

	if (isLoading) {
		return (
			<>
				<Heading tag="h1">{t("rpOAuthSetup.loadingTitle")}</Heading>
				<Notice
					noticeRole="info"
					noticeTitle={t("rpOAuthSetup.loadingTitle")}
					noticeTitleTag="h2"
				>
					<Text>{t("rpOAuthSetup.loadingBody")}</Text>
				</Notice>
			</>
		);
	}

	if (!oauthSetup) {
		return null;
	}

	const applicationName = oauthSetup.rpApplicationName.trim();
	const applicationUrl = oauthSetup.applicationUrl?.trim();
	const logoutUri = oauthSetup.logoutUri?.trim();
	const isFrench = i18n.language?.startsWith("fr");
	const departmentDisplayName =
		(isFrench
			? (oauthSetup.departmentNameFr ?? oauthSetup.departmentName)
			: (oauthSetup.departmentName ?? oauthSetup.departmentNameFr)) ?? null;
	const pkceLabel =
		oauthSetup.pkceEnabled === true
			? t("rpOAuthSetup.pkceEnabled")
			: oauthSetup.pkceEnabled === false
				? t("rpOAuthSetup.pkceDisabled")
				: t("rpOAuthSetup.notAvailable");

	return (
		<div className="flex flex-col gap-400">
			<Heading tag="h1">{applicationName}</Heading>

			<div className="flex flex-col gap-200">
				<div>
					<StatusBadge status={oauthSetup.status} />
				</div>
				{departmentDisplayName ? (
					<div className="flex items-center gap-200">
						<span className="font-semibold">{t("nav.organization")}:</span>
						<span>{departmentDisplayName}</span>
					</div>
				) : null}
				{applicationUrl ? (
					<div className="flex items-center gap-200">
						<span className="font-semibold">
							{t("rpOAuthSetup.applicationUrlLabel")}:
						</span>
						<a href={applicationUrl} rel="noopener noreferrer" target="_blank">
							{applicationUrl}
						</a>
					</div>
				) : null}
			</div>

			<Details detailsTitle={t("rpOAuthSetup.oauthSectionTitle")}>
				<div className="flex flex-col gap-200">
					<div className="flex items-center gap-200">
						<span className="font-semibold">
							{t("rpOAuthSetup.pkceEnabledLabel")}:
						</span>
						<span>{pkceLabel}</span>
					</div>
					<div className="flex items-center gap-200">
						<span className="font-semibold">
							{t("rpOAuthSetup.logoutUriLabel")}:
						</span>
						<span>{logoutUri ?? t("rpOAuthSetup.notAvailable")}</span>
					</div>
				</div>

				<div className="mt-200">
					<div className="font-semibold">
						{t("rpOAuthSetup.redirectUrisLabel")}
					</div>
					{redirectUris.length === 0 ? (
						<Text>{t("rpOAuthSetup.noRedirectUris")}</Text>
					) : (
						<ul className="list-disc">
							{redirectUris.map((uri) => (
								<li key={uri}>
									<Text>{uri}</Text>
								</li>
							))}
						</ul>
					)}
				</div>

				<div className="mt-200">
					<div className="font-semibold">
						{t("rpOAuthSetup.logoutRedirectUrisLabel")}
					</div>
					{logoutRedirectUris.length === 0 ? (
						<Text>{t("rpOAuthSetup.noLogoutRedirectUris")}</Text>
					) : (
						<ul className="list-disc pl-300">
							{logoutRedirectUris.map((uri) => (
								<li key={uri}>
									<Text>{uri}</Text>
								</li>
							))}
						</ul>
					)}
				</div>
			</Details>

			<Card
				cardTitle={t("rpOAuthSetup.usageReportAction")}
				cardTitleTag="h3"
				href={`/your-applications/${rpApplicationUuid}/mau-report`}
			/>
			<Card
				cardTitle={t("workspaces.manageCredentials")}
				cardTitleTag="h3"
				href={`/your-applications/${rpApplicationUuid}/manage-credentials`}
			/>
		</div>
	);
};
