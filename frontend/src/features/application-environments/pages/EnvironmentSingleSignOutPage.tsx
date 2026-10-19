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

const singleSignOutSchema = z
	.object({
		logoutMethod: z.enum(["front_channel", "back_channel"]).optional(),
		signOutRequestUrl: z.string().optional(),
		singleSignOut: z.boolean(),
	})
	.superRefine((values, context) => {
		if (!values.singleSignOut) {
			return;
		}
		if (!values.logoutMethod) {
			context.addIssue({
				code: "custom",
				message: "logoutMethod",
				path: ["logoutMethod"],
			});
		}
		if (
			!values.signOutRequestUrl ||
			!z.string().url().safeParse(values.signOutRequestUrl).success
		) {
			context.addIssue({
				code: "custom",
				message: "signOutRequestUrl",
				path: ["signOutRequestUrl"],
			});
		}
	});

type SingleSignOutFormValues = z.infer<typeof singleSignOutSchema>;

const inputValue = (event: FormEvent<Element>): string =>
	(event.target as HTMLInputElement).value;

const boolValue = (event: FormEvent<Element>): boolean =>
	inputValue(event) === "true";

export const EnvironmentSingleSignOutPage = (): FunctionComponent => {
	const { i18n, t } = useTranslation();
	const navigate = useNavigate({
		from: "/applications/$applicationUuid/environments/$environmentUuid/single-sign-out-method",
	});
	const { applicationUuid, environmentUuid } = useParams({
		from: "/applications/$applicationUuid/environments/$environmentUuid/single-sign-out-method",
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
		isUpdatingSingleSignOut,
		singleSignOutUpdateError,
		updateEnvironmentSingleSignOut,
	} = useApplicationEnvironmentManagement(applicationUuid);
	const form = useForm<SingleSignOutFormValues>({
		defaultValues: {
			logoutMethod: undefined,
			signOutRequestUrl: "",
			singleSignOut: false,
		},
		mode: "onBlur",
		resolver: zodResolver(singleSignOutSchema),
	});
	const {
		control,
		formState: { errors },
		handleSubmit,
		reset,
		clearErrors,
		setValue,
	} = form;
	const singleSignOut = useWatch({ control, name: "singleSignOut" });
	const isStaging = environment?.tenantCode === "staging";

	useEffect(() => {
		if (!environment) {
			return;
		}

		const enabled =
			environment.tenantCode === "staging" ||
			environment.config?.singleSignOut === true;
		reset({
			logoutMethod: enabled ? environment.config?.logoutMethod : undefined,
			signOutRequestUrl: enabled
				? (environment.config?.signOutRequestUrl ?? "")
				: "",
			singleSignOut: enabled,
		});
	}, [environment, reset]);

	const requestError = getRequestErrorNotice(singleSignOutUpdateError, {
		bodyKey: "applicationEnvironmentManagement.updateSingleSignOutErrorBody",
		titleKey: "applicationEnvironmentManagement.updateSingleSignOutErrorTitle",
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
	const singleSignOutErrorMessage = errors.singleSignOut
		? t("applicationEnvironmentConnect.stepTwo.validationSingleSignOut")
		: undefined;
	const logoutMethodErrorMessage = errors.logoutMethod
		? t("applicationEnvironmentConnect.stepTwo.validationLogoutMethod")
		: undefined;
	const signOutRequestUrlErrorMessage = errors.signOutRequestUrl
		? t("applicationEnvironmentConnect.stepTwo.validationSignOutRequestUrl")
		: undefined;
	const errorLinks: Record<string, string> = {};
	if (!isStaging && singleSignOutErrorMessage) {
		errorLinks["#single-sign-out-control"] = singleSignOutErrorMessage;
	}
	if (singleSignOut && logoutMethodErrorMessage) {
		errorLinks["#logout-method-control"] = logoutMethodErrorMessage;
	}
	if (singleSignOut && signOutRequestUrlErrorMessage) {
		errorLinks["#sign-out-request-url-control"] =
			signOutRequestUrlErrorMessage;
	}
	const hasValidationErrors = Object.keys(errorLinks).length > 0;

	if (isEnvironmentLoading) {
		return (
			<Grid columns="1fr" tag="div">
				<Heading tag="h1">
					{t("applicationEnvironmentManagement.changeSingleSignOutMethod")}
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
					{t("applicationEnvironmentManagement.changeSingleSignOutMethod")}
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

	const onSubmit = async (values: SingleSignOutFormValues): Promise<void> => {
		const enabled = isStaging || values.singleSignOut;
		if (enabled) {
			if (!values.logoutMethod || !values.signOutRequestUrl) {
				return;
			}
			await updateEnvironmentSingleSignOut({
				environmentUuid,
				logoutMethod: values.logoutMethod,
				signOutRequestUrl: values.signOutRequestUrl,
				singleSignOut: true,
			});
		} else {
			await updateEnvironmentSingleSignOut({
				environmentUuid,
				singleSignOut: false,
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
					{t("applicationEnvironmentManagement.changeSingleSignOutMethod")}
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
						{!isStaging && (
							<Controller
								control={control}
								name="singleSignOut"
								render={({ field }) => (
									<Radios
										required
										errorMessage={singleSignOutErrorMessage}
										id="single-sign-out-control"
										name={field.name}
										value={String(field.value)}
										legend={t(
											"applicationEnvironmentConnect.stepTwo.singleSignOut"
										)}
										options={[
											{
												id: "sso-yes",
												label: t("common.yes"),
												value: "true",
											},
											{
												id: "sso-no",
												label: t("common.no"),
												value: "false",
											},
										]}
										onInput={(event) => {
											const enabled = boolValue(event);
											field.onChange(enabled);
											clearErrors("singleSignOut");
											if (!enabled) {
												setValue("logoutMethod", undefined);
												setValue("signOutRequestUrl", "");
												clearErrors(["logoutMethod", "signOutRequestUrl"]);
											}
										}}
									/>
								)}
							/>
						)}
						{(isStaging || singleSignOut) && (
							<>
								<Controller
									control={control}
									name="logoutMethod"
									render={({ field }) => (
										<Radios
											required
											errorMessage={logoutMethodErrorMessage}
											id="logout-method-control"
											name={field.name}
											value={field.value}
											legend={t(
												"applicationEnvironmentConnect.stepTwo.logoutMethod"
											)}
											options={[
												{
													id: "front-channel",
													label: t(
														"applicationEnvironmentConnect.frontChannel"
													),
													value: "front_channel",
												},
												{
													id: "back-channel",
													label: t(
														"applicationEnvironmentConnect.backChannel"
													),
													value: "back_channel",
												},
											]}
											onInput={(event) => {
												field.onChange(inputValue(event));
												clearErrors("logoutMethod");
											}}
										/>
									)}
								/>
								<Controller
									control={control}
									name="signOutRequestUrl"
									render={({ field }) => (
										<Input
											required
											errorMessage={signOutRequestUrlErrorMessage}
											id="sign-out-request-url-control"
											inputId="sign-out-request-url"
											name={field.name}
											value={field.value}
											label={t(
												"applicationEnvironmentConnect.stepTwo.signOutRequestUrl"
											)}
											onInput={(event) => {
												field.onChange(inputValue(event));
												clearErrors("signOutRequestUrl");
											}}
										/>
									)}
								/>
							</>
						)}
						<div className="connect-environment-actions">
							<Grid alignItems="center" columns="auto auto 1fr" tag="div">
								<Button disabled={isUpdatingSingleSignOut} type="submit">
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