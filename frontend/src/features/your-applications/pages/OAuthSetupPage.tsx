import { useParams } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import type { FunctionComponent } from "@/common/types";
import { Card, Details, Grid, Heading, Notice, Text } from "@/components/ui";
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
				: t("common.notAvailable");

	return (
		<Grid columns="1fr" tag="div">
			<Heading tag="h1">{applicationName}</Heading>

			<Grid columns="1fr" tag="div">
				<div>
					<StatusBadge status={oauthSetup.status} />
				</div>
				{departmentDisplayName ? (
					<Grid columns="1fr" columnsTablet="auto 1fr" tag="dl">
						<dt>
							<strong>{t("nav.organization")}:</strong>
						</dt>
						<dd>{departmentDisplayName}</dd>
					</Grid>
				) : null}
				{applicationUrl ? (
					<Grid columns="1fr" columnsTablet="auto 1fr" tag="dl">
						<dt>
							<strong>{t("rpOAuthSetup.applicationUrlLabel")}:</strong>
						</dt>
						<dd>
							<a
								href={applicationUrl}
								rel="noopener noreferrer"
								target="_blank"
							>
								{applicationUrl}
							</a>
						</dd>
					</Grid>
				) : null}
			</Grid>

			<Details detailsTitle={t("rpOAuthSetup.oauthSectionTitle")}>
				<Grid columns="1fr" columnsTablet="auto 1fr" tag="dl">
					<dt>
						<strong>{t("rpOAuthSetup.pkceEnabledLabel")}:</strong>
					</dt>
					<dd>{pkceLabel}</dd>
					<dt>
						<strong>{t("rpOAuthSetup.logoutUriLabel")}:</strong>
					</dt>
					<dd>{logoutUri ?? t("common.notAvailable")}</dd>
				</Grid>
				<dl>
					<dt>
						<strong>{t("rpOAuthSetup.redirectUrisLabel")}</strong>
					</dt>
					<dd>
						{redirectUris.length === 0 ? (
							<Text>{t("rpOAuthSetup.noRedirectUris")}</Text>
						) : (
							<ul className="list-disc">
								{redirectUris.map((uri) => (
									<li key={uri}>{uri}</li>
								))}
							</ul>
						)}
					</dd>
				</dl>
				<dl>
					<dt>
						<strong>{t("rpOAuthSetup.logoutRedirectUrisLabel")}</strong>
					</dt>
					<dd>
						{logoutRedirectUris.length === 0 ? (
							<Text>{t("rpOAuthSetup.noLogoutRedirectUris")}</Text>
						) : (
							<ul className="list-disc pl-300">
								{logoutRedirectUris.map((uri) => (
									<li key={uri}>{uri}</li>
								))}
							</ul>
						)}
					</dd>
				</dl>
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
		</Grid>
	);
};
