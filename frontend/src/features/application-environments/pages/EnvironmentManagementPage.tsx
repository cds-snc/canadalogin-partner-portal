<<<<<<< HEAD
import { useNavigate, useParams } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Fragment, type ReactNode } from "react";
=======
import {
	useNavigate,
	useParams,
} from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
>>>>>>> origin/main
import type { FunctionComponent } from "@/common/types";
import {
	Button,
	ConfigurationGrid,
	Grid,
	Heading,
<<<<<<< HEAD
=======
	Icon,
>>>>>>> origin/main
	Link,
	Notice,
	Tabs,
	Text,
} from "@/components/ui";
import { getRequestErrorNotice } from "@/fetch";
import type {
	ApplicationEnvironmentCreate,
	ApplicationEnvironmentRead,
} from "@/fetch/application-environments";
import { useApplicationEnvironment } from "../hooks/use-application-environment";
import "./environments-page.css";

type EnvironmentConfig = Partial<ApplicationEnvironmentCreate>;

type SummaryRow = {
	change?: boolean;
<<<<<<< HEAD
	editHref?: string;
	label: string;
	value: ReactNode;
=======
	label: string;
	value: string;
>>>>>>> origin/main
};

type SummarySection = {
	rows: Array<SummaryRow>;
	title: string;
};

const CONFIGURATION_FIELD_COLUMN_WIDTH = "16rem";
<<<<<<< HEAD
const ABSOLUTE_URL_PATTERN = /^[a-z][a-z\d+.-]*:\/\//i;
=======
>>>>>>> origin/main

const isNonEmptyString = (value: unknown): value is string =>
	typeof value === "string" && value.trim().length > 0;

const formatValue = (
	value: unknown,
	inactiveLabel: string,
	formatToken: (token: string) => string
): string => {
	if (Array.isArray(value)) {
		return value.length > 0
			? value.map((item) => formatToken(String(item))).join(", ")
			: inactiveLabel;
	}
	if (isNonEmptyString(value)) {
		return formatToken(value);
	}
	return inactiveLabel;
};

<<<<<<< HEAD
const formatUrlList = (
	value: unknown,
	inactiveLabel: string,
	formatToken: (token: string) => string
): ReactNode => {
	if (!Array.isArray(value)) {
		return formatValue(value, inactiveLabel, formatToken);
	}

	const urls = value.map((item) => formatToken(String(item)));
	return urls.length > 0
		? urls.map((url, index) => (
				<Fragment key={`${url}-${index}`}>
					{index > 0 ? <br /> : null}
					{url}
				</Fragment>
			))
		: inactiveLabel;
};

=======
>>>>>>> origin/main
const formatDate = (value: string | null, language: string): string => {
	if (!value) {
		return "";
	}
<<<<<<< HEAD
	return new Intl.DateTimeFormat(language, {
		dateStyle: "long",
		timeStyle: "short",
=======
	const locale = language.startsWith("fr") ? "fr-CA" : language;
	return new Intl.DateTimeFormat(locale, {
		year: "numeric",
		month: "long",
		day: "numeric",
		hour: "numeric",
		minute: "2-digit",
		timeZoneName: "short",
>>>>>>> origin/main
	}).format(new Date(value));
};

const getConfig = (
	environment: ApplicationEnvironmentRead
): EnvironmentConfig => environment.config ?? {};

export const EnvironmentManagementPage = (): FunctionComponent => {
	const { i18n, t } = useTranslation();
	const navigate = useNavigate({
		from: "/applications/$applicationUuid/environments/$environmentUuid/",
	});
	const { applicationUuid, environmentUuid } = useParams({
		from: "/applications/$applicationUuid/environments/$environmentUuid",
	});
	const {
		data: environment,
		error,
		isLoading,
	} = useApplicationEnvironment(applicationUuid, environmentUuid);
	const errorNotice = getRequestErrorNotice(error, {
		bodyKey: "applicationEnvironmentManagement.errorBody",
		titleKey: "applicationEnvironmentManagement.errorTitle",
	});
	const inactiveLabel = t("applicationEnvironmentManagement.inactive");
	const formatToken = (token: string): string => {
<<<<<<< HEAD
		if (ABSOLUTE_URL_PATTERN.test(token)) {
			return token;
		}
=======
>>>>>>> origin/main
		const translationKey = `applicationEnvironmentManagement.values.${token}`;
		const translated = t(translationKey as never);
		return translated === translationKey ? token : translated;
	};

	if (isLoading) {
		return (
			<Grid columns="1fr" tag="div">
				<Heading tag="h1">
					{t("applicationEnvironmentManagement.loadingTitle")}
				</Heading>
				<Notice
					noticeRole="info"
					noticeTitle={t("applicationEnvironmentManagement.loadingTitle")}
					noticeTitleTag="h2"
				>
					<Text>{t("applicationEnvironmentManagement.loadingBody")}</Text>
				</Notice>
			</Grid>
		);
	}

	if (errorNotice || !environment) {
		return (
			<Grid columns="1fr" tag="div">
				<Heading tag="h1">
					{t("applicationEnvironmentManagement.title")}
				</Heading>
				<Notice
					noticeRole={errorNotice?.noticeRole ?? "danger"}
					noticeTitleTag="h2"
					noticeTitle={
						errorNotice
							? t(errorNotice.titleKey as never)
							: t("applicationEnvironmentManagement.errorTitle")
					}
				>
					<Text>
						{errorNotice
							? (errorNotice.bodyText ?? t(errorNotice.bodyKey as never))
							: t("applicationEnvironmentManagement.errorBody")}
					</Text>
				</Notice>
			</Grid>
		);
	}

	const config = getConfig(environment);
<<<<<<< HEAD
	const isProduction = environment.tenantCode === "production";
=======
>>>>>>> origin/main
	const isStaging = environment.tenantCode === "staging";
	const canSignMessages = config.canSignMessages === true;
	const canEncryptRequests = config.canEncryptRequests === true;
	const canDecryptMessages = config.canDecryptMessages === true;
	const singleSignOut = config.singleSignOut === true;
	const isPrivateKeyJwt = config.clientAuthMethod === "private_key_jwt";
	const sharesIdentifier = config.sharesIdentifier === true;
	const sections: Array<SummarySection> = [
		{
			title: t("applicationEnvironmentManagement.sections.environment"),
			rows: [
				{
					label: t("applicationEnvironmentManagement.fields.environmentType"),
					value: formatValue(
						environment.tenantCode,
						inactiveLabel,
						formatToken
					),
				},
				{
					change: true,
<<<<<<< HEAD
					editHref: `/applications/${applicationUuid}/environments/${environmentUuid}/environment-name`,
=======
>>>>>>> origin/main
					label: t("applicationEnvironmentManagement.fields.environmentName"),
					value: formatValue(
						config.environmentName ?? environment.partnerLabel,
						inactiveLabel,
						formatToken
					),
				},
				{
					change: true,
<<<<<<< HEAD
					editHref: `/applications/${applicationUuid}/environments/${environmentUuid}/english-url`,
=======
>>>>>>> origin/main
					label: t("applicationEnvironmentManagement.fields.englishUrl"),
					value: formatValue(
						config.applicationUrlEn,
						inactiveLabel,
						formatToken
					),
				},
				{
					change: true,
<<<<<<< HEAD
					editHref: `/applications/${applicationUuid}/environments/${environmentUuid}/french-url`,
=======
>>>>>>> origin/main
					label: t("applicationEnvironmentManagement.fields.frenchUrl"),
					value: formatValue(
						config.applicationUrlFr,
						inactiveLabel,
						formatToken
					),
				},
				{
					label: t("applicationEnvironmentManagement.fields.created"),
					value: formatDate(
						environment.createdAt,
						i18n.resolvedLanguage ?? "en"
					),
				},
				{
					label: t("applicationEnvironmentManagement.fields.lastModified"),
					value: formatDate(
						environment.updatedAt ?? environment.createdAt,
						i18n.resolvedLanguage ?? "en"
					),
				},
				...(isNonEmptyString(config.sourceEnvironmentUuid)
					? [
							{
								label: t("applicationEnvironmentManagement.fields.copiedFrom"),
								value: config.sourceEnvironmentUuid,
							},
						]
					: []),
			],
		},
		{
			title: t("applicationEnvironmentManagement.sections.connection"),
			rows: [
				{
					change: true,
<<<<<<< HEAD
					editHref: `/applications/${applicationUuid}/environments/${environmentUuid}/redirect-urls`,
					label: t("applicationEnvironmentManagement.fields.redirectUris"),
					value: formatUrlList(
						config.redirectUris,
						inactiveLabel,
						formatToken
					),
				},
				{
					change: true,
					editHref: `/applications/${applicationUuid}/environments/${environmentUuid}/post-logout-redirect-urls`,
					label: t(
						"applicationEnvironmentManagement.fields.postLogoutRedirectUris"
					),
					value: formatUrlList(
=======
					label: t("applicationEnvironmentManagement.fields.redirectUris"),
					value: formatValue(config.redirectUris, inactiveLabel, formatToken),
				},
				{
					change: true,
					label: t(
						"applicationEnvironmentManagement.fields.postLogoutRedirectUris"
					),
					value: formatValue(
>>>>>>> origin/main
						config.postLogoutRedirectUris,
						inactiveLabel,
						formatToken
					),
				},
				{
					change: true,
<<<<<<< HEAD
					editHref: `/applications/${applicationUuid}/environments/${environmentUuid}/single-sign-out-method`,
=======
>>>>>>> origin/main
					label: t(
						"applicationEnvironmentManagement.fields.singleSignOutMethod"
					),
					value: singleSignOut
						? formatValue(config.logoutMethod, inactiveLabel, formatToken)
						: inactiveLabel,
				},
				...(singleSignOut
					? [
							{
								change: true,
<<<<<<< HEAD
								editHref: `/applications/${applicationUuid}/environments/${environmentUuid}/single-sign-out-method`,
=======
>>>>>>> origin/main
								label: t(
									"applicationEnvironmentManagement.fields.signOutRequestUrl"
								),
								value: formatValue(
									config.signOutRequestUrl,
									inactiveLabel,
									formatToken
								),
							},
						]
					: []),
<<<<<<< HEAD
				...(isProduction
					? [
							{
								change: true,
								label: t(
									"applicationEnvironmentManagement.fields.outboundIps"
								),
								value: inactiveLabel,
							},
						]
					: []),
=======
				{
					change: true,
					label: t("applicationEnvironmentManagement.fields.outboundIps"),
					value: inactiveLabel,
				},
>>>>>>> origin/main
			],
		},
		{
			title: t("applicationEnvironmentManagement.sections.authentication"),
			rows: [
				{
					change: true,
<<<<<<< HEAD
					editHref: `/applications/${applicationUuid}/environments/${environmentUuid}/client-type`,
=======
>>>>>>> origin/main
					label: t("applicationEnvironmentManagement.fields.clientType"),
					value: formatValue(config.clientType, inactiveLabel, formatToken),
				},
				{
					change: true,
<<<<<<< HEAD
					editHref: `/applications/${applicationUuid}/environments/${environmentUuid}/client-type`,
=======
>>>>>>> origin/main
					label: t("applicationEnvironmentManagement.fields.pkce"),
					value:
						config.pkceSupported === true
							? t("applicationEnvironmentManagement.enabled")
							: t("applicationEnvironmentManagement.disabled"),
				},
				{
					change: true,
<<<<<<< HEAD
					editHref: `/applications/${applicationUuid}/environments/${environmentUuid}/authentication-method`,
=======
>>>>>>> origin/main
					label: t(
						"applicationEnvironmentManagement.fields.authenticationMethod"
					),
					value: formatValue(
						config.clientAuthMethod,
						inactiveLabel,
						formatToken
					),
				},
				...(isPrivateKeyJwt
					? [
							{
								change: true,
<<<<<<< HEAD
								editHref: `/applications/${applicationUuid}/environments/${environmentUuid}/authentication-method`,
=======
>>>>>>> origin/main
								label: t("applicationEnvironmentManagement.fields.jwksUri"),
								value: formatValue(config.jwksUri, inactiveLabel, formatToken),
							},
						]
					: []),
				{
					change: true,
<<<<<<< HEAD
					editHref: `/applications/${applicationUuid}/environments/${environmentUuid}/sector-identifier`,
=======
>>>>>>> origin/main
					label: t("applicationEnvironmentManagement.fields.sectorIdentifier"),
					value: sharesIdentifier
						? formatValue(
								config.sectorIdentifierUrl,
								inactiveLabel,
								formatToken
							)
						: inactiveLabel,
				},
			],
		},
		{
			title: t("applicationEnvironmentManagement.sections.verificationSigning"),
			rows: [
				{
					change: true,
<<<<<<< HEAD
					editHref: `/applications/${applicationUuid}/environments/${environmentUuid}/messages-verified`,
=======
>>>>>>> origin/main
					label: t("applicationEnvironmentManagement.fields.messagesVerified"),
					value: formatValue(
						config.verificationMessages,
						inactiveLabel,
						formatToken
					),
				},
				{
					change: true,
<<<<<<< HEAD
					editHref: `/applications/${applicationUuid}/environments/${environmentUuid}/messages-verified`,
=======
>>>>>>> origin/main
					label: t(
						"applicationEnvironmentManagement.fields.verificationAlgorithms"
					),
					value: formatValue(
						config.verificationSignatureAlgorithms,
						inactiveLabel,
						formatToken
					),
				},
				{
					change: true,
<<<<<<< HEAD
					editHref: `/applications/${applicationUuid}/environments/${environmentUuid}/messages-signed`,
=======
>>>>>>> origin/main
					label: t("applicationEnvironmentManagement.fields.messagesSigned"),
					value: canSignMessages
						? formatValue(config.signingMessages, inactiveLabel, formatToken)
						: inactiveLabel,
				},
				...(canSignMessages
					? [
							{
								change: true,
<<<<<<< HEAD
								editHref: `/applications/${applicationUuid}/environments/${environmentUuid}/messages-signed`,
=======
>>>>>>> origin/main
								label: t(
									"applicationEnvironmentManagement.fields.signingAlgorithms"
								),
								value: formatValue(
									config.signingSignatureAlgorithms,
									inactiveLabel,
									formatToken
								),
							},
						]
					: []),
			],
		},
		{
			title: t(
				"applicationEnvironmentManagement.sections.encryptionDecryption"
			),
			rows: [
				{
					change: true,
<<<<<<< HEAD
					editHref: `/applications/${applicationUuid}/environments/${environmentUuid}/requests-encrypted`,
					label: t("applicationEnvironmentManagement.fields.requestsEncrypted"),
					value: canEncryptRequests
						? t("applicationEnvironmentManagement.enabled")
=======
					label: t("applicationEnvironmentManagement.fields.requestsEncrypted"),
					value: canEncryptRequests
						? t("applicationEnvironmentManagement.values.request_object")
>>>>>>> origin/main
						: inactiveLabel,
				},
				...(canEncryptRequests
					? [
							{
								change: true,
<<<<<<< HEAD
								editHref: `/applications/${applicationUuid}/environments/${environmentUuid}/requests-encrypted`,
=======
>>>>>>> origin/main
								label: t(
									"applicationEnvironmentManagement.fields.encryptionKeyManagement"
								),
								value: formatValue(
									config.encryptionKeyAlgorithms,
									inactiveLabel,
									formatToken
								),
							},
							{
								change: true,
<<<<<<< HEAD
								editHref: `/applications/${applicationUuid}/environments/${environmentUuid}/requests-encrypted`,
=======
>>>>>>> origin/main
								label: t(
									"applicationEnvironmentManagement.fields.encryptionAlgorithms"
								),
								value: formatValue(
									config.encryptionContentAlgorithms,
									inactiveLabel,
									formatToken
								),
							},
						]
					: []),
				{
					change: true,
<<<<<<< HEAD
					editHref: `/applications/${applicationUuid}/environments/${environmentUuid}/messages-decrypted`,
=======
>>>>>>> origin/main
					label: t("applicationEnvironmentManagement.fields.messagesDecrypted"),
					value: canDecryptMessages
						? formatValue(config.decryptionMessages, inactiveLabel, formatToken)
						: inactiveLabel,
				},
				...(canDecryptMessages
					? [
							{
								change: true,
<<<<<<< HEAD
								editHref: `/applications/${applicationUuid}/environments/${environmentUuid}/messages-decrypted`,
=======
>>>>>>> origin/main
								label: t(
									"applicationEnvironmentManagement.fields.decryptionKeyManagement"
								),
								value: formatValue(
									config.decryptionKeyAlgorithms,
									inactiveLabel,
									formatToken
								),
							},
							{
								change: true,
<<<<<<< HEAD
								editHref: `/applications/${applicationUuid}/environments/${environmentUuid}/messages-decrypted`,
=======
>>>>>>> origin/main
								label: t(
									"applicationEnvironmentManagement.fields.decryptionAlgorithms"
								),
								value: formatValue(
									config.decryptionContentAlgorithms,
									inactiveLabel,
									formatToken
								),
							},
						]
					: []),
			],
		},
	];
	return (
		<Grid columns="1fr" container="xl" tag="div">
			<Grid columns="minmax(0, 46.5rem)" tag="div">
<<<<<<< HEAD
=======
				<Grid alignItems="center" columns="auto auto 1fr" tag="div">
					<Text marginBottom="0">
						<strong>{environment.partnerLabel}</strong>
					</Text>
					<div className="application-switch-icon">
						<Icon name="arrow-up-down" size="text" />
					</div>
					<Link href="/applications">
						{t("applicationEnvironments.switchApplication")}
					</Link>
				</Grid>
>>>>>>> origin/main
				<Heading tag="h1">{environment.partnerLabel}</Heading>
				<Text marginBottom="0">
					{t("applicationEnvironmentManagement.intro")}
					<br />
					<br />
					{t("applicationEnvironmentManagement.guidePrefix")}{" "}
					<Link href="#">
						{t("applicationEnvironmentManagement.guideLink")}
					</Link>
					.
				</Text>
				<Grid
					className="environment-management__actions"
					columns="repeat(auto-fit, minmax(14rem, max-content))"
					gap="400"
					tag="div"
				>
					<Button
						buttonRole="secondary"
						type="button"
						onGcdsClick={() => {
							void navigate({
								to: "/applications/$applicationUuid/environments",
								params: { applicationUuid },
								search: {
									connect: true,
									page: 1,
									sourceEnvironmentUuid: environmentUuid,
								},
							});
						}}
					>
						{t("applicationEnvironmentManagement.copyConfiguration")}
					</Button>
					{isStaging ? (
						<Button buttonRole="primary" type="button">
							{t("applicationEnvironmentManagement.requestProduction")}
						</Button>
					) : null}
				</Grid>
			</Grid>
			<Tabs
				ariaLabel={t("applicationEnvironmentManagement.tabsLabel")}
				items={[
					{
						active: true,
						href: `/applications/${applicationUuid}/environments/${environmentUuid}`,
						label: t("applicationEnvironmentManagement.configurationTab"),
					},
					{
						href: `/applications/${applicationUuid}/environments/${environmentUuid}/credentials`,
						label: t("applicationEnvironmentManagement.credentialsTab"),
					},
				]}
			/>
			{sections.map((section) => (
				<Grid key={section.title} columns="1fr" tag="section">
<<<<<<< HEAD
					<Heading marginBottom="0" tag="h2">
						{section.title}
					</Heading>
=======
					<Heading marginBottom="0" tag="h2">{section.title}</Heading>
>>>>>>> origin/main
					<ConfigurationGrid
						ariaLabel={section.title}
						fieldColumnWidth={CONFIGURATION_FIELD_COLUMN_WIDTH}
						rows={section.rows.map((row) => ({
							edit: row.change ? (
								<Link
<<<<<<< HEAD
									href={row.editHref ?? "#"}
=======
									href="#"
>>>>>>> origin/main
									ariaLabel={t(
										"applicationEnvironmentManagement.changeAccessible",
										{ field: row.label }
									)}
								>
									{t("applicationEnvironmentManagement.change")}
								</Link>
							) : null,
							field: row.label,
							value: row.value,
						}))}
					/>
				</Grid>
			))}
		</Grid>
	);
};
