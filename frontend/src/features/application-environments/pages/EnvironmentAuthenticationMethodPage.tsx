import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, type FormEvent } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import type { FunctionComponent } from "@/common/types";
import {
	Button,
	ErrorSummary,
	Grid,
	Heading,
	Icon,
	Input,
	Link,
	Notice,
	Radios,
	Text,
} from "@/components/ui";
import { getRequestErrorNotice } from "@/fetch";
import { useApplicationEnvironments } from "../hooks/use-application-environments";
import { useApplicationEnvironment } from "../hooks/use-application-environment";
import { useApplicationEnvironmentManagement } from "../hooks/use-application-environment-management";
import "./environments-page.css";

const authenticationMethodSchema = z
	.object({
		clientAuthMethod: z
			.enum(["private_key_jwt", "client_secret_basic", "client_secret_post"])
			.optional(),
		jwksUri: z.string().optional(),
	})
	.superRefine((values, context) => {
		if (!values.clientAuthMethod) {
			context.addIssue({
				code: "custom",
				message: "clientAuthMethod",
				path: ["clientAuthMethod"],
			});
		}
		if (
			values.clientAuthMethod === "private_key_jwt" &&
			(!values.jwksUri || !z.string().url().safeParse(values.jwksUri).success)
		) {
			context.addIssue({
				code: "custom",
				message: "jwksUri",
				path: ["jwksUri"],
			});
		}
	});

type AuthenticationMethodFormValues = z.infer<
	typeof authenticationMethodSchema
>;

const inputValue = (event: FormEvent<Element>): string =>
	(event.target as HTMLInputElement).value;

export const EnvironmentAuthenticationMethodPage = (): FunctionComponent => {
	const { i18n, t } = useTranslation();
	const navigate = useNavigate({
		from: "/applications/$applicationUuid/environments/$environmentUuid/authentication-method",
	});
	const { applicationUuid, environmentUuid } = useParams({
		from: "/applications/$applicationUuid/environments/$environmentUuid/authentication-method",
	});
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
		authenticationMethodUpdateError,
		isUpdatingAuthenticationMethod,
		updateEnvironmentAuthenticationMethod,
	} = useApplicationEnvironmentManagement(applicationUuid);
	const form = useForm<AuthenticationMethodFormValues>({
		defaultValues: {
			clientAuthMethod: undefined,
			jwksUri: "",
		},
		mode: "onBlur",
		resolver: zodResolver(authenticationMethodSchema),
	});
	const {
		control,
		formState: { errors },
		handleSubmit,
		reset,
		clearErrors,
		setValue,
	} = form;
	const clientAuthMethod = useWatch({ control, name: "clientAuthMethod" });

	useEffect(() => {
		if (!environment) {
			return;
		}

		reset({
			clientAuthMethod: environment.config?.clientAuthMethod,
			jwksUri: environment.config?.jwksUri ?? "",
		});
	}, [environment, reset]);

	const requestError = getRequestErrorNotice(authenticationMethodUpdateError, {
		bodyKey: "applicationEnvironmentManagement.updateAuthenticationMethodErrorBody",
		titleKey:
			"applicationEnvironmentManagement.updateAuthenticationMethodErrorTitle",
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
	const clientAuthMethodErrorMessage = errors.clientAuthMethod
		? t("applicationEnvironmentConnect.stepThree.validationClientAuthMethod")
		: undefined;
	const jwksUriErrorMessage = errors.jwksUri
		? t("applicationEnvironmentConnect.stepThree.validationJwksUri")
		: undefined;
	const errorLinks: Record<string, string> = {};
	if (clientAuthMethodErrorMessage) {
		errorLinks["#client-auth-method-control"] = clientAuthMethodErrorMessage;
	}
	if (clientAuthMethod === "private_key_jwt" && jwksUriErrorMessage) {
		errorLinks["#jwks-uri-control"] = jwksUriErrorMessage;
	}
	const hasValidationErrors = Object.keys(errorLinks).length > 0;

	if (isEnvironmentLoading) {
		return (
			<Grid columns="1fr" tag="div">
				<Heading tag="h1">
					{t("applicationEnvironmentManagement.changeAuthenticationMethod")}
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
					{t("applicationEnvironmentManagement.changeAuthenticationMethod")}
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

	const onSubmit = async (
		values: AuthenticationMethodFormValues
	): Promise<void> => {
		if (!values.clientAuthMethod) {
			return;
		}
		if (values.clientAuthMethod === "private_key_jwt") {
			if (!values.jwksUri) {
				return;
			}
			await updateEnvironmentAuthenticationMethod({
				clientAuthMethod: values.clientAuthMethod,
				environmentUuid,
				jwksUri: values.jwksUri,
			});
		} else {
			await updateEnvironmentAuthenticationMethod({
				clientAuthMethod: values.clientAuthMethod,
				environmentUuid,
				jwksUri: null,
			});
		}
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
					{t("applicationEnvironmentManagement.changeAuthenticationMethod")}
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
								"applicationEnvironmentManagement.authenticationMethodEditorIntro"
							)}
						</Text>
						<Text>
							{t(
								"applicationEnvironmentManagement.authenticationMethodEditorLearnMore"
							)}
						</Text>
						<Controller
							control={control}
							name="clientAuthMethod"
							render={({ field }) => (
								<Radios
									required
									errorMessage={clientAuthMethodErrorMessage}
									id="client-auth-method-control"
									name={field.name}
									value={field.value}
									legend={t(
										"applicationEnvironmentConnect.stepThree.clientAuthMethod"
									)}
									options={[
										{
											id: "private-key-jwt",
											label: t(
												"applicationEnvironmentConnect.privateKeyJwt"
											),
											hint: t(
												"applicationEnvironmentConnect.stepThree.privateKeyJwtHint"
											),
											value: "private_key_jwt",
										},
										{
											id: "client-secret-basic",
											label: t(
												"applicationEnvironmentConnect.clientSecretBasic"
											),
											hint: t(
												"applicationEnvironmentConnect.stepThree.clientSecretBasicHint"
											),
											value: "client_secret_basic",
										},
										{
											id: "client-secret-post",
											label: t(
												"applicationEnvironmentConnect.clientSecretPost"
											),
											hint: t(
												"applicationEnvironmentConnect.stepThree.clientSecretPostHint"
											),
											value: "client_secret_post",
										},
									]}
									onInput={(event) => {
										const selectedMethod = inputValue(event) as
												| "private_key_jwt"
												| "client_secret_basic"
												| "client_secret_post";
										field.onChange(selectedMethod);
										clearErrors(["clientAuthMethod", "jwksUri"]);
										if (selectedMethod !== "private_key_jwt") {
											setValue("jwksUri", "", { shouldValidate: false });
										}
								}}
								/>
							)}
						/>
						{clientAuthMethod === "private_key_jwt" ? (
							<Controller
								control={control}
								name="jwksUri"
								render={({ field }) => (
									<Input
										required
										errorMessage={jwksUriErrorMessage}
										id="jwks-uri-control"
										inputId="jwks-uri"
										name={field.name}
										value={field.value}
										hint={t(
											"applicationEnvironmentConnect.stepThree.jwksUriHint"
										)}
										label={t(
											"applicationEnvironmentConnect.stepThree.jwksUri"
										)}
										onInput={(event) => {
											field.onChange(inputValue(event));
											clearErrors("jwksUri");
										}}
									/>
								)}
							/>
						) : null}
						<div className="connect-environment-actions">
							<Grid alignItems="center" columns="auto auto 1fr" tag="div">
								<Button
									disabled={isUpdatingAuthenticationMethod}
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
