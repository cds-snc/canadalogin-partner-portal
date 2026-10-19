import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, type FormEvent } from "react";
import { Controller, useForm } from "react-hook-form";
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
	Radios,
	Text,
} from "@/components/ui";
import { getRequestErrorNotice } from "@/fetch";
import { useApplicationEnvironments } from "../hooks/use-application-environments";
import { useApplicationEnvironment } from "../hooks/use-application-environment";
import { useApplicationEnvironmentManagement } from "../hooks/use-application-environment-management";
import "./environments-page.css";

const clientTypeSchema = z
	.object({
		clientType: z.enum(["public", "confidential"]).optional(),
		pkceSupported: z.boolean().optional(),
	})
	.superRefine((values, context) => {
		if (!values.clientType) {
			context.addIssue({
				code: "custom",
				message: "clientType",
				path: ["clientType"],
			});
		}
		if (values.pkceSupported === undefined) {
			context.addIssue({
				code: "custom",
				message: "pkceSupported",
				path: ["pkceSupported"],
			});
		}
		if (values.clientType === "public" && values.pkceSupported === false) {
			context.addIssue({
				code: "custom",
				message: "pkceSupported",
				path: ["pkceSupported"],
			});
		}
	});

type ClientTypeFormValues = z.infer<typeof clientTypeSchema>;

const inputValue = (event: FormEvent<Element>): string =>
	(event.target as HTMLInputElement).value;

const boolValue = (event: FormEvent<Element>): boolean =>
	inputValue(event) === "true";

export const EnvironmentClientTypePage = (): FunctionComponent => {
	const { i18n, t } = useTranslation();
	const navigate = useNavigate({
		from: "/applications/$applicationUuid/environments/$environmentUuid/client-type",
	});
	const { applicationUuid, environmentUuid } = useParams({
		from: "/applications/$applicationUuid/environments/$environmentUuid/client-type",
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
		clientTypeUpdateError,
		isUpdatingClientType,
		updateEnvironmentClientType,
	} = useApplicationEnvironmentManagement(applicationUuid);
	const form = useForm<ClientTypeFormValues>({
		defaultValues: {
			clientType: undefined,
			pkceSupported: undefined,
		},
		mode: "onBlur",
		resolver: zodResolver(clientTypeSchema),
	});
	const {
		control,
		formState: { errors },
		handleSubmit,
		reset,
		clearErrors,
		setValue,
	} = form;

	useEffect(() => {
		if (!environment) {
			return;
		}

		reset({
			clientType: environment.config?.clientType,
			pkceSupported:
				typeof environment.config?.pkceSupported === "boolean"
					? environment.config.pkceSupported
					: undefined,
		});
	}, [environment, reset]);

	const requestError = getRequestErrorNotice(clientTypeUpdateError, {
		bodyKey: "applicationEnvironmentManagement.updateClientTypeErrorBody",
		titleKey: "applicationEnvironmentManagement.updateClientTypeErrorTitle",
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
	const clientTypeErrorMessage = errors.clientType
		? t("applicationEnvironmentConnect.stepThree.validationClientType")
		: undefined;
	const pkceSupportedErrorMessage = errors.pkceSupported
		? t("applicationEnvironmentConnect.stepThree.validationPkceSupported")
		: undefined;
	const errorLinks: Record<string, string> = {};
	if (clientTypeErrorMessage) {
		errorLinks["#client-type-control"] = clientTypeErrorMessage;
	}
	if (pkceSupportedErrorMessage) {
		errorLinks["#pkce-supported-control"] = pkceSupportedErrorMessage;
	}
	const hasValidationErrors = Object.keys(errorLinks).length > 0;

	if (isEnvironmentLoading) {
		return (
			<Grid columns="1fr" tag="div">
				<Heading tag="h1">
					{t("applicationEnvironmentManagement.changeClientType")}
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
					{t("applicationEnvironmentManagement.changeClientType")}
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

	const onSubmit = async (values: ClientTypeFormValues): Promise<void> => {
		if (!values.clientType || values.pkceSupported === undefined) {
			return;
		}
		if (values.clientType === "public") {
			if (!values.pkceSupported) {
				return;
			}
			await updateEnvironmentClientType({
				environmentUuid,
				clientType: "public",
				pkceSupported: true,
			});
		} else {
			await updateEnvironmentClientType({
				environmentUuid,
				clientType: "confidential",
				pkceSupported: values.pkceSupported,
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
					{t("applicationEnvironmentManagement.changeClientType")}
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
					onSubmit={(event) => {
						void handleSubmit(onSubmit)(event);
					}}
				>
					<Grid columns="1fr" tag="div">
						<Text>{t("applicationEnvironmentManagement.clientTypeEditorIntro")}</Text>
						<Text>
							{t("applicationEnvironmentManagement.clientTypeEditorLearnMore")}
						</Text>
						<Controller
							control={control}
							name="clientType"
							render={({ field }) => (
								<Radios
									required
									errorMessage={clientTypeErrorMessage}
									id="client-type-control"
									name={field.name}
									value={field.value}
									legend={t(
										"applicationEnvironmentConnect.stepThree.clientType"
									)}
									options={[
										{
											id: "client-public",
											label: t(
												"applicationEnvironmentConnect.publicClient"
											),
											hint: t(
												"applicationEnvironmentConnect.stepThree.publicClientHint"
											),
											value: "public",
										},
										{
											id: "client-confidential",
											label: t(
												"applicationEnvironmentConnect.confidentialClient"
											),
											hint: t(
												"applicationEnvironmentConnect.stepThree.confidentialClientHint"
											),
											value: "confidential",
										},
									]}
									onInput={(event) => {
										const selectedClientType = inputValue(event) as
												| "public"
												| "confidential";
										field.onChange(selectedClientType);
										if (selectedClientType === "public") {
											setValue("pkceSupported", true, {
												shouldValidate: true,
											});
										}
										clearErrors(["clientType", "pkceSupported"]);
								}}
								/>
							)}
						/>
						<Controller
							control={control}
							name="pkceSupported"
							render={({ field }) => (
								<Radios
									required
									errorMessage={pkceSupportedErrorMessage}
									id="pkce-supported-control"
									name={field.name}
									hint={t(
									"applicationEnvironmentConnect.stepThree.pkceHint"
									)}
									legend={t(
										"applicationEnvironmentConnect.stepThree.pkceSupported"
									)}
									options={[
										{ id: "pkce-yes", label: t("common.yes"), value: "true" },
										{ id: "pkce-no", label: t("common.no"), value: "false" },
									]}
									value={
										field.value === undefined ? undefined : String(field.value)
									}
									onInput={(event) => {
										field.onChange(boolValue(event));
										clearErrors("pkceSupported");
									}}
								/>
							)}
						/>
						<div className="connect-environment-actions">
							<Grid alignItems="center" columns="auto auto 1fr" tag="div">
								<Button disabled={isUpdatingClientType} type="submit">
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