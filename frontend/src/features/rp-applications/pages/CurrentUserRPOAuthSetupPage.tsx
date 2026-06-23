import { useParams } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import type { FunctionComponent } from "@/common/types";
import { CenteredPageLayout } from "@/components/layout";
import {
	Button,
	Container,
	Grid,
	Heading,
	Notice,
	Text,
} from "@/components/ui";
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

type LabelValueRowProps = {
	label: string;
	value: ReactNode;
};

const LabelValueRow = ({ label, value }: LabelValueRowProps): ReactNode => (
	<div className="mb-300 last:mb-0">
		<Grid
			columns="1fr"
			columnsDesktop="12rem 1fr"
			columnsTablet="12rem 1fr"
			tag="div"
		>
			<Text marginBottom="0">
				<strong>{label}:</strong>
			</Text>
			<div>{value}</div>
		</Grid>
	</div>
);

export const CurrentUserRPOAuthSetupPage = (): FunctionComponent => {
	const { rpApplicationUuid } = useParams({
		from: "/rp-applications/mine/$rpApplicationUuid",
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
						`/rp-applications/mine/${rpApplicationUuid}/department-setup`
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
			<CenteredPageLayout className="max-w-4xl gap-400">
				<Heading tag="h1">{t("rpOAuthSetup.loadingTitle")}</Heading>
				<Notice
					noticeRole="info"
					noticeTitle={t("rpOAuthSetup.loadingTitle")}
					noticeTitleTag="h2"
				>
					<Text>{t("rpOAuthSetup.loadingBody")}</Text>
				</Notice>
			</CenteredPageLayout>
		);
	}

	if (!oauthSetup) {
		return null;
	}

	const applicationName = oauthSetup.rpApplicationName.trim();
	const applicationUrl = oauthSetup.applicationUrl?.trim();
	const discoveryEndpoint = oauthSetup.discoveryEndpoint?.trim() ?? "";
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
		<CenteredPageLayout className="max-w-5xl gap-500">
			<div className="flex flex-wrap items-center justify-between gap-300">
				<Heading marginBottom="0" tag="h1">
					{applicationName}
				</Heading>
				<div className="flex shrink-0 gap-200">
					<Button
						href={`/rp-applications/mine/${rpApplicationUuid}/mau-report`}
						type="link"
					>
						{t("rpOAuthSetup.usageReportAction")}
					</Button>
					<Button
						href={`/rp-applications/mine/${rpApplicationUuid}/client-secrets`}
						type="link"
					>
						{t("workspaces.clientCredentials")}
					</Button>
				</div>
			</div>

			<div className="flex flex-wrap gap-x-500 gap-y-200">
				<div>
					<span className="mb-100 block text-sm font-medium text-[var(--gcds-text-secondary)]">
						{t("rpOAuthSetup.statusLabel")}
					</span>
					<StatusBadge status={oauthSetup.status} />
				</div>
				{applicationUrl ? (
					<div>
						<span className="mb-100 block text-sm font-medium text-[var(--gcds-text-secondary)]">
							{t("rpOAuthSetup.applicationUrlLabel")}
						</span>
						<a href={applicationUrl} rel="noopener noreferrer" target="_blank">
							{applicationUrl}
						</a>
					</div>
				) : null}
				{departmentDisplayName ? (
					<div>
						<span className="mb-100 block text-sm font-medium text-[var(--gcds-text-secondary)]">
							{t("rpOAuthSetup.departmentLabel")}
						</span>
						<span>{departmentDisplayName}</span>
					</div>
				) : null}
			</div>

			<Container
				border
				id="rp-oauth-setup-oauth-details"
				padding="300"
				tag="section"
			>
				<Heading marginTop="0" tag="h2">
					{t("rpOAuthSetup.oauthSectionTitle")}
				</Heading>
				<div>
					<LabelValueRow
						label={t("rpOAuthSetup.discoveryEndpointLabel")}
						value={
							discoveryEndpoint.length > 0
								? discoveryEndpoint
								: t("rpOAuthSetup.notAvailable")
						}
					/>
					<LabelValueRow
						label={t("rpOAuthSetup.pkceEnabledLabel")}
						value={pkceLabel}
					/>
					<LabelValueRow
						label={t("rpOAuthSetup.logoutUriLabel")}
						value={logoutUri ?? t("rpOAuthSetup.notAvailable")}
					/>
				</div>

				<div className="mt-200">
					<Heading tag="h3">{t("rpOAuthSetup.redirectUrisLabel")}</Heading>
					{redirectUris.length === 0 ? (
						<Text>{t("rpOAuthSetup.noRedirectUris")}</Text>
					) : (
						<ul className="list-disc pl-300">
							{redirectUris.map((uri) => (
								<li key={uri}>
									<Text>{uri}</Text>
								</li>
							))}
						</ul>
					)}
				</div>

				<div className="mt-200">
					<Heading tag="h3">
						{t("rpOAuthSetup.logoutRedirectUrisLabel")}
					</Heading>
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
			</Container>
		</CenteredPageLayout>
	);
};
