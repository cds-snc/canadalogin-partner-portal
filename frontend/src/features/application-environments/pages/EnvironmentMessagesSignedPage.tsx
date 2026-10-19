import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, type FormEvent } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import type { FunctionComponent } from "@/common/types";
import type { ApplicationEnvironmentSigningUpdate } from "@/fetch/application-environments";
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
import { SIGNING_ALGORITHMS } from "./connect-environment-form";
import "./environments-page.css";

const signingSchema = z
	.object({
		canSignMessages: z.boolean().optional(),
		signingMessages: z.array(z.enum(["request_object", "token_endpoint"])),
		signingSignatureAlgorithms: z.array(z.enum(SIGNING_ALGORITHMS)),
	})
	.superRefine((values, context) => {
		if (values.canSignMessages === undefined) {
			context.addIssue({
				code: "custom",
				message: "canSignMessages",
				path: ["canSignMessages"],
			});
		}
		if (values.canSignMessages) {
			if (values.signingMessages.length === 0) {
				context.addIssue({
					code: "custom",
					message: "signingMessages",
					path: ["signingMessages"],
				});
			}
			if (values.signingSignatureAlgorithms.length === 0) {
				context.addIssue({
					code: "custom",
					message: "signingSignatureAlgorithms",
					path: ["signingSignatureAlgorithms"],
				});
			}
		}
	});

type SigningFormValues = z.infer<typeof signingSchema>;

const inputValue = (event: FormEvent<Element>): string =>
	(event.target as HTMLInputElement).value;

const boolValue = (event: FormEvent<Element>): boolean =>
	inputValue(event) === "true";

const algorithmOptions = SIGNING_ALGORITHMS.map((value) => ({
	id: `sign-${value}`,
	label: value,
	value,
}));

export const EnvironmentMessagesSignedPage = (): FunctionComponent => {
	const { i18n, t } = useTranslation();
	const navigate = useNavigate({
		from: "/applications/$applicationUuid/environments/$environmentUuid/messages-signed",
	});
	const { applicationUuid, environmentUuid } = useParams({
		from: "/applications/$applicationUuid/environments/$environmentUuid/messages-signed",
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
		isUpdatingSigning,
		signingUpdateError,
		updateEnvironmentSigning,
	} = useApplicationEnvironmentManagement(applicationUuid);
	const form = useForm<SigningFormValues>({
		defaultValues: {
			canSignMessages: undefined,
			signingMessages: [],
			signingSignatureAlgorithms: [],
		},
		mode: "onBlur",
		resolver: zodResolver(signingSchema),
	});
	const {
		clearErrors,
		control,
		formState: { errors },
		handleSubmit,
		reset,
		setValue,
	} = form;
	const canSignMessages = useWatch({ control, name: "canSignMessages" });

	useEffect(() => {
		if (!environment) {
			return;
		}

		const enabled = environment.config?.canSignMessages === true;
		reset({
			canSignMessages: environment.config?.canSignMessages,
			signingMessages: enabled
				? (environment.config?.signingMessages ?? [])
				: [],
			signingSignatureAlgorithms: enabled
				? (environment.config?.signingSignatureAlgorithms ?? [])
				: [],
		});
	}, [environment, reset]);

	const requestError = getRequestErrorNotice(signingUpdateError, {
		bodyKey: "applicationEnvironmentManagement.updateSigningErrorBody",
		titleKey: "applicationEnvironmentManagement.updateSigningErrorTitle",
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
	const canSignMessagesErrorMessage = errors.canSignMessages
		? t("applicationEnvironmentConnect.stepFour.validationCanSignMessages")
		: undefined;
	const signingMessagesErrorMessage = errors.signingMessages
		? t("applicationEnvironmentConnect.stepFour.validationSigningMessages")
		: undefined;
	const signingAlgorithmsErrorMessage = errors.signingSignatureAlgorithms
		? t("applicationEnvironmentConnect.stepFour.validationSigningAlgorithms")
		: undefined;
	const errorLinks: Record<string, string> = {};
	if (canSignMessagesErrorMessage) {
		errorLinks["#can-sign-messages-control"] = canSignMessagesErrorMessage;
	}
	if (canSignMessages && signingMessagesErrorMessage) {
		errorLinks["#signing-messages-control"] = signingMessagesErrorMessage;
	}
	if (canSignMessages && signingAlgorithmsErrorMessage) {
		errorLinks["#signing-algorithms-control"] = signingAlgorithmsErrorMessage;
	}
	const hasValidationErrors = Object.keys(errorLinks).length > 0;

	if (isEnvironmentLoading) {
		return (
			<Grid columns="1fr" tag="div">
				<Heading tag="h1">
					{t("applicationEnvironmentManagement.changeMessagesSigned")}
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
					{t("applicationEnvironmentManagement.changeMessagesSigned")}
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

	const onSubmit = async (values: SigningFormValues): Promise<void> => {
		if (values.canSignMessages === undefined) {
			return;
		}

		const payload: ApplicationEnvironmentSigningUpdate = values.canSignMessages
			? {
					canSignMessages: true,
					signingMessages: values.signingMessages as [
						"request_object" | "token_endpoint",
						...Array<"request_object" | "token_endpoint">,
					],
					signingSignatureAlgorithms: values.signingSignatureAlgorithms as [
						(typeof SIGNING_ALGORITHMS)[number],
						...Array<(typeof SIGNING_ALGORITHMS)[number]>,
					],
				}
			: {
					canSignMessages: false,
					signingMessages: [],
					signingSignatureAlgorithms: [],
				};
		await updateEnvironmentSigning({ environmentUuid, ...payload });
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
					{t("applicationEnvironmentManagement.changeMessagesSigned")}
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
							{t("applicationEnvironmentManagement.signingEditorIntro")}
						</Text>
						<Text>
							{t("applicationEnvironmentManagement.signingEditorLearnMore")}
						</Text>
						<Fieldset
							legendSize="h3"
							legend={t(
								"applicationEnvironmentConnect.stepFour.signingTitle"
							)}
						>
							<Controller
								control={control}
								name="canSignMessages"
								render={({ field }) => (
									<Radios
										required
										errorMessage={canSignMessagesErrorMessage}
										id="can-sign-messages-control"
										name={field.name}
										legend={t(
											"applicationEnvironmentConnect.stepFour.canSignMessages"
										)}
										options={[
											{
												id: "sign-yes",
												label: t("common.yes"),
												value: "true",
											},
											{
												id: "sign-no",
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
											clearErrors("canSignMessages");
											if (!enabled) {
												setValue("signingMessages", []);
												setValue("signingSignatureAlgorithms", []);
												clearErrors([
													"signingMessages",
													"signingSignatureAlgorithms",
												]);
											}
									}}
								/>
								)}
							/>
							{canSignMessages && (
								<>
									<Controller
										control={control}
										name="signingMessages"
										render={({ field }) => (
											<Checkboxes
												required
												errorMessage={signingMessagesErrorMessage}
												id="signing-messages-control"
												name={field.name}
												value={field.value}
												legend={t(
													"applicationEnvironmentConnect.stepFour.signingMessages"
												)}
												options={[
													{
														id: "sign-request",
														label: t(
															"applicationEnvironmentConnect.requestObject"
														),
														value: "request_object",
													},
													{
														id: "sign-token",
														label: t(
															"applicationEnvironmentConnect.tokenEndpoint"
														),
														value: "token_endpoint",
													},
												]}
												onInput={(event) => {
													field.onChange(event.target.value);
													clearErrors("signingMessages");
												}}
											/>
										)}
									/>
									<Controller
										control={control}
										name="signingSignatureAlgorithms"
										render={({ field }) => (
											<Checkboxes
												required
												errorMessage={signingAlgorithmsErrorMessage}
												id="signing-algorithms-control"
												name={field.name}
												options={algorithmOptions}
												value={field.value}
												legend={t(
													"applicationEnvironmentConnect.stepFour.signingAlgorithms"
												)}
												onInput={(event) => {
													field.onChange(event.target.value);
													clearErrors("signingSignatureAlgorithms");
												}}
											/>
										)}
									/>
								</>
							)}
						</Fieldset>
						<div className="connect-environment-actions">
							<Grid alignItems="center" columns="auto auto 1fr" tag="div">
								<Button disabled={isUpdatingSigning} type="submit">
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