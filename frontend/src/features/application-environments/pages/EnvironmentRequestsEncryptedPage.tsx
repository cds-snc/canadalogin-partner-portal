import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, type FormEvent } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import type { FunctionComponent } from "@/common/types";
import type { ApplicationEnvironmentEncryptionUpdate } from "@/fetch/application-environments";
import {
	Button,
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

const encryptionSchema = z
	.object({
		canEncryptRequests: z.boolean().optional(),
		encryptionKeyAlgorithms: z.array(z.enum(ENCRYPTION_KEY_ALGORITHMS)),
		encryptionContentAlgorithms: z.array(
			z.enum(ENCRYPTION_CONTENT_ALGORITHMS)
		),
	})
	.superRefine((values, context) => {
		if (values.canEncryptRequests === undefined) {
			context.addIssue({
				code: "custom",
				message: "canEncryptRequests",
				path: ["canEncryptRequests"],
			});
		}
		if (values.canEncryptRequests) {
			if (values.encryptionKeyAlgorithms.length === 0) {
				context.addIssue({
					code: "custom",
					message: "encryptionKeyAlgorithms",
					path: ["encryptionKeyAlgorithms"],
				});
			}
			if (values.encryptionContentAlgorithms.length === 0) {
				context.addIssue({
					code: "custom",
					message: "encryptionContentAlgorithms",
					path: ["encryptionContentAlgorithms"],
				});
			}
		}
	});

type EncryptionFormValues = z.infer<typeof encryptionSchema>;

const inputValue = (event: FormEvent<Element>): string =>
	(event.target as HTMLInputElement).value;

const boolValue = (event: FormEvent<Element>): boolean =>
	inputValue(event) === "true";

const keyAlgorithmOptions = ENCRYPTION_KEY_ALGORITHMS.map((value) => ({
	id: `encrypt-key-${value.toLowerCase()}`,
	label: value,
	value,
}));

const contentAlgorithmOptions = ENCRYPTION_CONTENT_ALGORITHMS.map((value) => ({
	id: `encrypt-content-${value.toLowerCase()}`,
	label: value,
	value,
}));

export const EnvironmentRequestsEncryptedPage = (): FunctionComponent => {
	const { i18n, t } = useTranslation();
	const navigate = useNavigate({
		from: "/applications/$applicationUuid/environments/$environmentUuid/requests-encrypted",
	});
	const { applicationUuid, environmentUuid } = useParams({
		from: "/applications/$applicationUuid/environments/$environmentUuid/requests-encrypted",
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
		encryptionUpdateError,
		isUpdatingEncryption,
		updateEnvironmentEncryption,
	} = useApplicationEnvironmentManagement(applicationUuid);
	const form = useForm<EncryptionFormValues>({
		defaultValues: {
			canEncryptRequests: undefined,
			encryptionKeyAlgorithms: [],
			encryptionContentAlgorithms: [],
		},
		mode: "onBlur",
		resolver: zodResolver(encryptionSchema),
	});
	const {
		clearErrors,
		control,
		formState: { errors },
		handleSubmit,
		reset,
		setValue,
	} = form;
	const canEncryptRequests = useWatch({ control, name: "canEncryptRequests" });

	useEffect(() => {
		if (!environment) {
			return;
		}

		const enabled = environment.config?.canEncryptRequests === true;
		reset({
			canEncryptRequests: environment.config?.canEncryptRequests,
			encryptionKeyAlgorithms: enabled
				? (environment.config?.encryptionKeyAlgorithms ?? [])
				: [],
			encryptionContentAlgorithms: enabled
				? (environment.config?.encryptionContentAlgorithms ?? [])
				: [],
		});
	}, [environment, reset]);

	const requestError = getRequestErrorNotice(encryptionUpdateError, {
		bodyKey: "applicationEnvironmentManagement.updateEncryptionErrorBody",
		titleKey: "applicationEnvironmentManagement.updateEncryptionErrorTitle",
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
	const canEncryptRequestsErrorMessage = errors.canEncryptRequests
		? t("applicationEnvironmentConnect.stepFour.validationCanEncryptRequests")
		: undefined;
	const encryptionKeyAlgorithmsErrorMessage = errors.encryptionKeyAlgorithms
		? t(
				"applicationEnvironmentConnect.stepFour.validationEncryptionKeyAlgorithms"
			)
		: undefined;
	const encryptionContentAlgorithmsErrorMessage = errors.encryptionContentAlgorithms
		? t(
				"applicationEnvironmentConnect.stepFour.validationEncryptionContentAlgorithms"
			)
		: undefined;
	const errorLinks: Record<string, string> = {};
	if (canEncryptRequestsErrorMessage) {
		errorLinks["#can-encrypt-requests-control"] =
			canEncryptRequestsErrorMessage;
	}
	if (canEncryptRequests && encryptionKeyAlgorithmsErrorMessage) {
		errorLinks["#encryption-key-algorithms-control"] =
			encryptionKeyAlgorithmsErrorMessage;
	}
	if (canEncryptRequests && encryptionContentAlgorithmsErrorMessage) {
		errorLinks["#encryption-content-algorithms-control"] =
			encryptionContentAlgorithmsErrorMessage;
	}
	const hasValidationErrors = Object.keys(errorLinks).length > 0;

	if (isEnvironmentLoading) {
		return (
			<Grid columns="1fr" tag="div">
				<Heading tag="h1">
					{t("applicationEnvironmentManagement.changeRequestsEncrypted")}
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
					{t("applicationEnvironmentManagement.changeRequestsEncrypted")}
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

	const onSubmit = async (values: EncryptionFormValues): Promise<void> => {
		if (values.canEncryptRequests === undefined) {
			return;
		}

		const payload: ApplicationEnvironmentEncryptionUpdate =
			values.canEncryptRequests
				? {
						canEncryptRequests: true,
						encryptionKeyAlgorithms: values.encryptionKeyAlgorithms as [
							(typeof ENCRYPTION_KEY_ALGORITHMS)[number],
							...Array<(typeof ENCRYPTION_KEY_ALGORITHMS)[number]>,
						],
						encryptionContentAlgorithms: values.encryptionContentAlgorithms as [
							(typeof ENCRYPTION_CONTENT_ALGORITHMS)[number],
							...Array<(typeof ENCRYPTION_CONTENT_ALGORITHMS)[number]>,
						],
					}
				: {
						canEncryptRequests: false,
						encryptionKeyAlgorithms: [],
						encryptionContentAlgorithms: [],
					};
		await updateEnvironmentEncryption({ environmentUuid, ...payload });
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
					{t("applicationEnvironmentManagement.changeRequestsEncrypted")}
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
							{t("applicationEnvironmentManagement.encryptionEditorIntro")}
						</Text>
						<Text>
							{t("applicationEnvironmentManagement.encryptionEditorLearnMore")}
						</Text>
						<Fieldset
							legendSize="h3"
							legend={t(
								"applicationEnvironmentConnect.stepFour.encryptionTitle"
							)}
						>
							<Controller
								control={control}
								name="canEncryptRequests"
								render={({ field }) => (
									<Radios
										required
										errorMessage={canEncryptRequestsErrorMessage}
										id="can-encrypt-requests-control"
										name={field.name}
										legend={t(
											"applicationEnvironmentConnect.stepFour.canEncryptRequests"
										)}
										options={[
											{
												id: "encrypt-yes",
												label: t("common.yes"),
												value: "true",
											},
											{
												id: "encrypt-no",
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
											clearErrors("canEncryptRequests");
											if (!enabled) {
												setValue("encryptionKeyAlgorithms", []);
												setValue("encryptionContentAlgorithms", []);
												clearErrors([
													"encryptionKeyAlgorithms",
													"encryptionContentAlgorithms",
												]);
											}
									}}
									/>
								)}
							/>
							{canEncryptRequests && (
								<>
									<Controller
										control={control}
										name="encryptionKeyAlgorithms"
										render={({ field }) => (
											<Radios
												required
												errorMessage={encryptionKeyAlgorithmsErrorMessage}
												id="encryption-key-algorithms-control"
												name={field.name}
												options={keyAlgorithmOptions}
												value={field.value[0] ?? ""}
												legend={t(
													"applicationEnvironmentConnect.stepFour.encryptionKeyAlgorithms"
												)}
												onInput={(event) => {
													const value = inputValue(event);
													field.onChange(value ? [value] : []);
													clearErrors("encryptionKeyAlgorithms");
												}}
											/>
										)}
									/>
									<Controller
										control={control}
										name="encryptionContentAlgorithms"
										render={({ field }) => (
											<Radios
												required
												id="encryption-content-algorithms-control"
												name={field.name}
												options={contentAlgorithmOptions}
												value={field.value[0] ?? ""}
														errorMessage={
															encryptionContentAlgorithmsErrorMessage
														}
												legend={t(
													"applicationEnvironmentConnect.stepFour.encryptionContentAlgorithms"
												)}
												onInput={(event) => {
													const value = inputValue(event);
													field.onChange(value ? [value] : []);
													clearErrors("encryptionContentAlgorithms");
												}}
											/>
										)}
									/>
								</>
							)}
						</Fieldset>
						<div className="connect-environment-actions">
							<Grid alignItems="center" columns="auto auto 1fr" tag="div">
								<Button disabled={isUpdatingEncryption} type="submit">
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
