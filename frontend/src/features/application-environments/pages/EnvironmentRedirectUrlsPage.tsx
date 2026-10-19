import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, useParams } from "@tanstack/react-router";
import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import type { FunctionComponent } from "@/common/types";
import {
	Button,
	ErrorSummary,
	Grid,
	Heading,
	Icon,
	Link,
	Notice,
	Text,
} from "@/components/ui";
import { getRequestErrorNotice } from "@/fetch";
import { useApplicationEnvironments } from "../hooks/use-application-environments";
import { useApplicationEnvironment } from "../hooks/use-application-environment";
import { useApplicationEnvironmentManagement } from "../hooks/use-application-environment-management";
import { EnvironmentUrlListFields } from "./EnvironmentUrlListFields";
import "./environments-page.css";

const redirectUrlsSchema = z.object({
	redirectUris: z.array(z.string().url()).min(1),
});

type RedirectUrlsFormValues = z.infer<typeof redirectUrlsSchema>;

export const EnvironmentRedirectUrlsPage = (): FunctionComponent => {
	const { i18n, t } = useTranslation();
	const navigate = useNavigate();
	const params = useParams({ strict: false });
	const applicationUuid = params.applicationUuid ?? "";
	const environmentUuid = params.environmentUuid ?? "";
	const {
		data: environment,
		error: environmentError,
		isLoading: isEnvironmentLoading,
	} = useApplicationEnvironment(applicationUuid, environmentUuid);
	const { data: environments } = useApplicationEnvironments(
		applicationUuid,
		1,
		1
	);
	const {
		isUpdatingRedirectUris,
		redirectUrisUpdateError,
		updateEnvironmentRedirectUris,
	} = useApplicationEnvironmentManagement(applicationUuid);
	const form = useForm<RedirectUrlsFormValues>({
		defaultValues: { redirectUris: [""] },
		mode: "onBlur",
		resolver: zodResolver(redirectUrlsSchema),
	});
	const {
		control,
		formState: { errors },
		handleSubmit,
		reset,
		setValue,
	} = form;
	const redirectUris = useWatch({ control, name: "redirectUris" }) ?? [];
	const redirectUriRowCount = Math.max(1, redirectUris.length);

	useEffect(() => {
		if (!environment) {
			return;
		}

		reset({
			redirectUris: environment.config?.redirectUris?.length
				? environment.config.redirectUris
				: [""],
		});
	}, [environment, reset]);

	const requestError = getRequestErrorNotice(redirectUrisUpdateError, {
		bodyKey: "applicationEnvironmentManagement.updateRedirectUrlsErrorBody",
		titleKey: "applicationEnvironmentManagement.updateRedirectUrlsErrorTitle",
	});
	const loadError = getRequestErrorNotice(environmentError, {
		bodyKey: "applicationEnvironmentManagement.errorBody",
		titleKey: "applicationEnvironmentManagement.errorTitle",
	});
	const applicationName =
		i18n.resolvedLanguage === "fr" && environments?.application.nameFr
			? environments.application.nameFr
			: (environments?.application.nameEn ??
				t("applicationEnvironmentConnect.applicationNameFallback"));
	const redirectUriErrorMessage = (index: number): string | undefined => {
		const fieldError = errors.redirectUris;
		const itemError = Array.isArray(fieldError)
			? fieldError[index]
			: index === 0
				? fieldError
				: undefined;
		return itemError
			? t("applicationEnvironmentConnect.stepTwo.validationRedirectUrl")
			: undefined;
	};
	const errorLinks = Object.fromEntries(
		Array.from({ length: redirectUriRowCount }, (_, index) => {
			const errorMessage = redirectUriErrorMessage(index);
			return errorMessage
				? [`#redirect-uri-control-${index}`, errorMessage]
				: null;
		}).filter((entry): entry is [string, string] => entry !== null)
	);

	if (isEnvironmentLoading) {
		return (
			<Grid columns="1fr" tag="div">
				<Heading tag="h1">
					{t("applicationEnvironmentManagement.changeRedirectUrls")}
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

	if (loadError || !environment) {
		return (
			<Grid columns="1fr" tag="div">
				<Heading tag="h1">
					{t("applicationEnvironmentManagement.changeRedirectUrls")}
				</Heading>
				<Notice
					noticeRole={loadError?.noticeRole ?? "danger"}
					noticeTitleTag="h2"
					noticeTitle={
						loadError
							? t(loadError.titleKey as never)
							: t("applicationEnvironmentManagement.errorTitle")
					}
				>
					<Text>
						{loadError
							? (loadError.bodyText ?? t(loadError.bodyKey as never))
							: t("applicationEnvironmentManagement.errorBody")}
					</Text>
				</Notice>
			</Grid>
		);
	}

	const onSubmit = async ({
		redirectUris: submittedRedirectUris,
	}: RedirectUrlsFormValues): Promise<void> => {
		await updateEnvironmentRedirectUris({
			environmentUuid,
			redirectUris: submittedRedirectUris,
		});
		await navigate({
			to: "/applications/$applicationUuid/environments/$environmentUuid",
			params: { applicationUuid, environmentUuid },
		});
	};

	return (
		<Grid columns="1fr" container="xl" tag="div">
			<Grid alignItems="center" columns="auto auto 1fr" tag="div">
				<Text marginBottom="0">
					<strong>{applicationName}</strong>
				</Text>
				<div className="application-switch-icon">
					<Icon name="arrow-up-down" size="text" />
				</div>
				<Link href="/applications">
					{t("applicationEnvironments.switchApplication")}
				</Link>
			</Grid>
			<Grid columns="minmax(0, 46.5rem)" tag="div">
				<Heading tag="h1">
					{t("applicationEnvironmentManagement.changeRedirectUrls")}
				</Heading>
				{requestError ? (
					<Notice
						noticeRole={requestError.noticeRole}
						noticeTitle={t(requestError.titleKey as never)}
						noticeTitleTag="h2"
					>
						<Text>
							{requestError.bodyText ?? t(requestError.bodyKey as never)}
						</Text>
					</Notice>
				) : null}
				{Object.keys(errors).length > 0 ? (
					<ErrorSummary errorLinks={errorLinks} listen={false} />
				) : null}
				<form
					onSubmit={(event) => {
						void handleSubmit(onSubmit)(event);
					}}
				>
					<Grid columns="1fr" tag="div">
						<Text>
							{t("applicationEnvironmentManagement.redirectUrlsIntro")}
						</Text>
						<Text>
							<Link href="/support">
								{t(
									"applicationEnvironmentManagement.redirectUrlsRequirementsLink"
								)}
							</Link>
						</Text>
						<EnvironmentUrlListFields
							control={control}
							errorMessage={redirectUriErrorMessage}
							fieldName="redirectUris"
							hint={t("applicationEnvironmentConnect.stepTwo.redirectUrlsHint")}
							idPrefix="redirect-uri"
							removeLabel={t("common.remove")}
							values={redirectUris}
							addLabel={t(
								"applicationEnvironmentConnect.stepTwo.addRedirectUri"
							)}
							getFieldLabel={(index) =>
								t("applicationEnvironmentConnect.stepTwo.redirectUrl", {
									count: index + 1,
								})
							}
							legend={t(
								"applicationEnvironmentConnect.stepTwo.redirectUrlsTitle"
							)}
							setValues={(values) => {
								setValue("redirectUris", values);
							}}
						/>
						<div className="connect-environment-actions">
							<Grid alignItems="center" columns="auto auto 1fr" tag="div">
								<Button disabled={isUpdatingRedirectUris} type="submit">
									{t("applicationEnvironmentManagement.saveChanges")}
								</Button>
								<Link
									href={`/applications/${applicationUuid}/environments/${environmentUuid}`}
								>
									{t("applicationEnvironmentManagement.cancel")}
								</Link>
							</Grid>
						</div>
					</Grid>
				</form>
			</Grid>
		</Grid>
	);
};
