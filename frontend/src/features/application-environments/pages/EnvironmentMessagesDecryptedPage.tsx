import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, type FormEvent } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import type { FunctionComponent } from "@/common/types";
import type { ApplicationEnvironmentDecryptionUpdate } from "@/fetch/application-environments";
import {
	Button,
	Checkboxes,
	ErrorSummary,
	Fieldset,
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
import {
	ENCRYPTION_CONTENT_ALGORITHMS,
	ENCRYPTION_KEY_ALGORITHMS,
} from "./connect-environment-form";
import "./environments-page.css";

const decryptionSchema = z
	.object({
		canDecryptMessages: z.boolean().optional(),
		decryptionMessages: z.array(
			z.enum(["token_endpoint_response", "id_token", "userinfo"])
		),
		decryptionKeyAlgorithms: z.array(z.enum(ENCRYPTION_KEY_ALGORITHMS)),
		decryptionContentAlgorithms: z.array(
			z.enum(ENCRYPTION_CONTENT_ALGORITHMS)
		),
	})
	.superRefine((values, context) => {
		if (values.canDecryptMessages === undefined) {
			context.addIssue({
				code: "custom",
				message: "canDecryptMessages",
				path: ["canDecryptMessages"],
			});
		}
		if (values.canDecryptMessages) {
			if (values.decryptionMessages.length === 0) {
				context.addIssue({
					code: "custom",
					message: "decryptionMessages",
					path: ["decryptionMessages"],
				});
			}
			if (values.decryptionKeyAlgorithms.length === 0) {
				context.addIssue({
					code: "custom",
					message: "decryptionKeyAlgorithms",
					path: ["decryptionKeyAlgorithms"],
				});
			}
			if (values.decryptionContentAlgorithms.length === 0) {
				context.addIssue({
					code: "custom",
					message: "decryptionContentAlgorithms",
					path: ["decryptionContentAlgorithms"],
				});
			}
		}
	});

type DecryptionFormValues = z.infer<typeof decryptionSchema>;

type DecryptionMessage = DecryptionFormValues["decryptionMessages"][number];

const inputValue = (event: FormEvent<Element>): string =>
	(event.target as HTMLInputElement).value;

const boolValue = (event: FormEvent<Element>): boolean =>
	inputValue(event) === "true";

const messageOptions = [
	{
		id: "decrypt-token-endpoint-response",
		labelKey: "applicationEnvironmentConnect.tokenEndpointResponse",
		value: "token_endpoint_response" as const,
	},
	{
		id: "decrypt-id-token",
		labelKey: "applicationEnvironmentConnect.idToken",
		value: "id_token" as const,
	},
	{
		id: "decrypt-userinfo",
		labelKey: "applicationEnvironmentConnect.userinfo",
		value: "userinfo" as const,
	},
];

const keyAlgorithmOptions = ENCRYPTION_KEY_ALGORITHMS.map((value) => ({
	id: `decrypt-key-${value.toLowerCase()}`,
	label: value,
	value,
}));

const contentAlgorithmOptions = ENCRYPTION_CONTENT_ALGORITHMS.map((value) => ({
	id: `decrypt-content-${value.toLowerCase()}`,
	label: value,
	value,
}));

export const EnvironmentMessagesDecryptedPage = (): FunctionComponent => {
	const { i18n, t } = useTranslation();
	const navigate = useNavigate({
		from: "/applications/$applicationUuid/environments/$environmentUuid/messages-decrypted",
	});
	const { applicationUuid, environmentUuid } = useParams({
		from: "/applications/$applicationUuid/environments/$environmentUuid/messages-decrypted",
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
		decryptionUpdateError,
		isUpdatingDecryption,
		updateEnvironmentDecryption,
	} = useApplicationEnvironmentManagement(applicationUuid);
	const form = useForm<DecryptionFormValues>({
		defaultValues: {
			canDecryptMessages: undefined,
			decryptionMessages: [],
			decryptionKeyAlgorithms: [],
			decryptionContentAlgorithms: [],
		},
		mode: "onBlur",
		resolver: zodResolver(decryptionSchema),
	});
	const {
		clearErrors,
		control,
		formState: { errors },
		handleSubmit,
		reset,
		setValue,
	} = form;
	const values = useWatch({ control });
	const canDecryptMessages =
		values.canDecryptMessages ?? environment?.config?.canDecryptMessages;

	useEffect(() => {
		if (!environment) {
			return;
		}

		const enabled = environment.config?.canDecryptMessages === true;
		reset({
			canDecryptMessages: environment.config?.canDecryptMessages,
			decryptionMessages: enabled
				? (environment.config?.decryptionMessages ?? [])
				: [],
			decryptionKeyAlgorithms: enabled
				? (environment.config?.decryptionKeyAlgorithms ?? [])
				: [],
			decryptionContentAlgorithms: enabled
				? (environment.config?.decryptionContentAlgorithms ?? [])
				: [],
		});
	}, [environment, reset]);

	const requestError = getRequestErrorNotice(decryptionUpdateError, {
		bodyKey: "applicationEnvironmentManagement.updateDecryptionErrorBody",
		titleKey: "applicationEnvironmentManagement.updateDecryptionErrorTitle",
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
	const canDecryptMessagesErrorMessage = errors.canDecryptMessages
		? t("applicationEnvironmentConnect.stepFour.validationCanDecryptMessages")
		: undefined;
	const decryptionMessagesErrorMessage = errors.decryptionMessages
		? t("applicationEnvironmentConnect.stepFour.validationDecryptionMessages")
		: undefined;
	const decryptionKeyAlgorithmsErrorMessage = errors.decryptionKeyAlgorithms
		? t(
				"applicationEnvironmentConnect.stepFour.validationDecryptionKeyAlgorithms"
			)
		: undefined;
	const decryptionContentAlgorithmsErrorMessage =
		errors.decryptionContentAlgorithms
			? t(
					"applicationEnvironmentConnect.stepFour.validationDecryptionContentAlgorithms"
				)
			: undefined;
	const errorLinks: Record<string, string> = {};
	if (canDecryptMessagesErrorMessage) {
		errorLinks["#can-decrypt-messages-control"] =
			canDecryptMessagesErrorMessage;
	}
	if (canDecryptMessages && decryptionMessagesErrorMessage) {
		errorLinks["#decryption-messages-control"] = decryptionMessagesErrorMessage;
	}
	if (canDecryptMessages && decryptionKeyAlgorithmsErrorMessage) {
		errorLinks["#decryption-key-algorithms-control"] =
			decryptionKeyAlgorithmsErrorMessage;
	}
	if (canDecryptMessages && decryptionContentAlgorithmsErrorMessage) {
		errorLinks["#decryption-content-algorithms-control"] =
			decryptionContentAlgorithmsErrorMessage;
	}
	const hasValidationErrors = Object.keys(errorLinks).length > 0;

	if (isEnvironmentLoading) {
		return (
			<Grid columns="1fr" tag="div">
				<Heading tag="h1">
					{t("applicationEnvironmentManagement.changeMessagesDecrypted")}
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
					{t("applicationEnvironmentManagement.changeMessagesDecrypted")}
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

	const onSubmit = async (values: DecryptionFormValues): Promise<void> => {
		if (values.canDecryptMessages === undefined) {
			return;
		}

		const payload: ApplicationEnvironmentDecryptionUpdate =
			values.canDecryptMessages
				? {
						canDecryptMessages: true,
						decryptionMessages: values.decryptionMessages as [
							DecryptionMessage,
							...Array<DecryptionMessage>,
						],
						decryptionKeyAlgorithms: values.decryptionKeyAlgorithms as [
							(typeof ENCRYPTION_KEY_ALGORITHMS)[number],
							...Array<(typeof ENCRYPTION_KEY_ALGORITHMS)[number]>,
						],
						decryptionContentAlgorithms: values.decryptionContentAlgorithms as [
							(typeof ENCRYPTION_CONTENT_ALGORITHMS)[number],
							...Array<(typeof ENCRYPTION_CONTENT_ALGORITHMS)[number]>,
						],
					}
				: {
						canDecryptMessages: false,
						decryptionMessages: [],
						decryptionKeyAlgorithms: [],
						decryptionContentAlgorithms: [],
					};
		await updateEnvironmentDecryption({ environmentUuid, ...payload });
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
					{t("applicationEnvironmentManagement.changeMessagesDecrypted")}
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
							{t("applicationEnvironmentManagement.decryptionEditorIntro")}
						</Text>
						<Text>
							{t("applicationEnvironmentManagement.decryptionEditorLearnMore")}
						</Text>
						<Fieldset
							legendSize="h3"
							legend={t(
								"applicationEnvironmentConnect.stepFour.decryptionTitle"
							)}
						>
							<Controller
								control={control}
								name="canDecryptMessages"
								render={({ field }) => (
									<Radios
										required
										errorMessage={canDecryptMessagesErrorMessage}
										id="can-decrypt-messages-control"
										name={field.name}
										legend={t(
											"applicationEnvironmentConnect.stepFour.canDecryptMessages"
										)}
										options={[
											{
												id: "decrypt-yes",
												label: t("common.yes"),
												value: "true",
											},
											{
												id: "decrypt-no",
												label: t("common.no"),
												value: "false",
											},
										]}
										value={
											field.value === undefined
												? undefined
												: String(field.value)
										}
										onInput={(event) => {
											const enabled = boolValue(event);
											field.onChange(enabled);
											clearErrors("canDecryptMessages");
											if (!enabled) {
												setValue("decryptionMessages", []);
												setValue("decryptionKeyAlgorithms", []);
												setValue("decryptionContentAlgorithms", []);
												clearErrors([
														"decryptionMessages",
														"decryptionKeyAlgorithms",
														"decryptionContentAlgorithms",
													]);
											}
										}}
									/>
								)}
							/>
							{canDecryptMessages && (
								<>
									<Controller
										control={control}
										name="decryptionMessages"
										render={({ field }) => (
											<Checkboxes
												required
												errorMessage={decryptionMessagesErrorMessage}
												id="decryption-messages-control"
												name={field.name}
												value={field.value}
												legend={t(
													"applicationEnvironmentConnect.stepFour.decryptionMessages"
												)}
												options={messageOptions.map(({ id, labelKey, value }) => ({
													id,
													label: t(labelKey as never),
													value,
												}))}
												onInput={(event) => {
													field.onChange(event.target.value);
													clearErrors("decryptionMessages");
												}}
											/>
										)}
									/>
									<Controller
										control={control}
										name="decryptionKeyAlgorithms"
										render={({ field }) => (
											<Radios
												required
												errorMessage={decryptionKeyAlgorithmsErrorMessage}
												id="decryption-key-algorithms-control"
												name={field.name}
												options={keyAlgorithmOptions}
												value={field.value[0] ?? ""}
												legend={t(
													"applicationEnvironmentConnect.stepFour.decryptionKeyAlgorithms"
												)}
												onInput={(event) => {
													const value = inputValue(event);
													field.onChange(value ? [value] : []);
													clearErrors("decryptionKeyAlgorithms");
												}}
											/>
										)}
									/>
									<Controller
										control={control}
										name="decryptionContentAlgorithms"
										render={({ field }) => (
											<Radios
												required
												errorMessage={decryptionContentAlgorithmsErrorMessage}
												id="decryption-content-algorithms-control"
												name={field.name}
												options={contentAlgorithmOptions}
												value={field.value[0] ?? ""}
												legend={t(
													"applicationEnvironmentConnect.stepFour.decryptionContentAlgorithms"
												)}
												onInput={(event) => {
													const value = inputValue(event);
													field.onChange(value ? [value] : []);
													clearErrors("decryptionContentAlgorithms");
												}}
											/>
										)}
									/>
								</>
							)}
						</Fieldset>
						<div className="connect-environment-actions">
							<Grid alignItems="center" columns="auto auto 1fr" tag="div">
								<Button disabled={isUpdatingDecryption} type="submit">
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
