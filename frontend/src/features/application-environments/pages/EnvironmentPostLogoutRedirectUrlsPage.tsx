import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, useParams } from "@tanstack/react-router";
import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import type { FunctionComponent } from "@/common/types";
import {
	ErrorSummary,
	Grid,
	Heading,
	Icon,
	Link,
	Notice,
	Text,
	Button,
} from "@/components/ui";
import { getRequestErrorNotice } from "@/fetch";
import { useApplicationEnvironments } from "../hooks/use-application-environments";
import { useApplicationEnvironment } from "../hooks/use-application-environment";
import { useApplicationEnvironmentManagement } from "../hooks/use-application-environment-management";
import { EnvironmentUrlListFields } from "./EnvironmentUrlListFields";
import "./environments-page.css";

const postLogoutRedirectUrlsSchema = z.object({
	postLogoutRedirectUris: z.array(z.string().url()).min(1),
});

type PostLogoutRedirectUrlsFormValues = z.infer<
	typeof postLogoutRedirectUrlsSchema
>;

export const EnvironmentPostLogoutRedirectUrlsPage = (): FunctionComponent => {
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
		isUpdatingPostLogoutRedirectUris,
		postLogoutRedirectUrisUpdateError,
		updateEnvironmentPostLogoutRedirectUris,
	} = useApplicationEnvironmentManagement(applicationUuid);
	const form = useForm<PostLogoutRedirectUrlsFormValues>({
		defaultValues: { postLogoutRedirectUris: [""] },
		mode: "onBlur",
		resolver: zodResolver(postLogoutRedirectUrlsSchema),
	});
	const {
		control,
		formState: { errors },
		handleSubmit,
		reset,
		setValue,
	} = form;
	const postLogoutRedirectUris =
		useWatch({ control, name: "postLogoutRedirectUris" }) ?? [];
	const postLogoutRedirectUriRowCount = Math.max(
		1,
		postLogoutRedirectUris.length
	);

	useEffect(() => {
		if (!environment) {
			return;
		}

		reset({
			postLogoutRedirectUris: environment.config?.postLogoutRedirectUris?.length
				? environment.config.postLogoutRedirectUris
				: [""],
		});
	}, [environment, reset]);

	const requestError = getRequestErrorNotice(
		postLogoutRedirectUrisUpdateError,
		{
			bodyKey:
				"applicationEnvironmentManagement.updatePostLogoutRedirectUrlsErrorBody",
			titleKey:
				"applicationEnvironmentManagement.updatePostLogoutRedirectUrlsErrorTitle",
		}
	);
	const loadError = getRequestErrorNotice(environmentError, {
		bodyKey: "applicationEnvironmentManagement.errorBody",
		titleKey: "applicationEnvironmentManagement.errorTitle",
	});
	const applicationName =
		i18n.resolvedLanguage === "fr" && environments?.application.nameFr
			? environments.application.nameFr
			: (environments?.application.nameEn ??
				t("applicationEnvironmentConnect.applicationNameFallback"));
	const postLogoutRedirectUrlErrorMessage = (
		index: number
	): string | undefined => {
		const fieldError = errors.postLogoutRedirectUris;
		const itemError = Array.isArray(fieldError)
			? fieldError[index]
			: index === 0
				? fieldError
				: undefined;
		return itemError
			? t("applicationEnvironmentConnect.stepTwo.validationPostLogoutUrl")
			: undefined;
	};
	const errorLinks = Object.fromEntries(
		Array.from({ length: postLogoutRedirectUriRowCount }, (_, index) => {
			const errorMessage = postLogoutRedirectUrlErrorMessage(index);
			return errorMessage
				? [`#post-logout-redirect-uri-control-${index}`, errorMessage]
				: null;
		}).filter((entry): entry is [string, string] => entry !== null)
	);
	const hasValidationErrors = Object.keys(errorLinks).length > 0;

	if (isEnvironmentLoading) {
		return (
			<Grid columns="1fr" tag="div">
				<Heading tag="h1">
					{t("applicationEnvironmentManagement.changePostLogoutRedirectUrls")}
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
					{t("applicationEnvironmentManagement.changePostLogoutRedirectUrls")}
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
		postLogoutRedirectUris: submittedPostLogoutRedirectUris,
	}: PostLogoutRedirectUrlsFormValues): Promise<void> => {
		await updateEnvironmentPostLogoutRedirectUris({
			environmentUuid,
			postLogoutRedirectUris: submittedPostLogoutRedirectUris,
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
					{t("applicationEnvironmentManagement.changePostLogoutRedirectUrls")}
				</Heading>
				{hasValidationErrors ? (
					<ErrorSummary errorLinks={errorLinks} listen={false} />
				) : null}
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
				<form
					noValidate
					onSubmit={(event) => {
						void handleSubmit(onSubmit)(event);
					}}
				>
					<Grid columns="1fr" tag="div">
						<Text>
							{t(
								"applicationEnvironmentManagement.postLogoutRedirectUrlsIntro"
							)}
						</Text>
						<Text>
							<Link href="/support">
								{t(
									"applicationEnvironmentManagement.postLogoutRedirectUrlsRequirementsLink"
								)}
							</Link>
						</Text>
						<EnvironmentUrlListFields
							control={control}
							errorMessage={postLogoutRedirectUrlErrorMessage}
							fieldName="postLogoutRedirectUris"
							idPrefix="post-logout-redirect-uri"
							removeLabel={t("common.remove")}
							rowClassName="post-logout-url-row"
							values={postLogoutRedirectUris}
							addLabel={t(
								"applicationEnvironmentConnect.stepTwo.addPostLogoutRedirectUri"
							)}
							getFieldLabel={(index) =>
								t("applicationEnvironmentConnect.stepTwo.postLogoutUrl", {
									count: index + 1,
								})
							}
							hint={t(
								"applicationEnvironmentConnect.stepTwo.postLogoutUrlsHint"
							)}
							legend={t(
								"applicationEnvironmentConnect.stepTwo.postLogoutUrlsTitle"
							)}
							setValues={(values) => {
								setValue("postLogoutRedirectUris", values);
							}}
						/>
						<div className="connect-environment-actions">
							<Grid alignItems="center" columns="auto auto 1fr" tag="div">
								<Button
									disabled={isUpdatingPostLogoutRedirectUris}
									type="submit"
								>
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
