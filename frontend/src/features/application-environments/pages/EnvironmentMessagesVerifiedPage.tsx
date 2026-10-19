import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, useParams } from "@tanstack/react-router";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import type { FunctionComponent } from "@/common/types";
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
	Text,
} from "@/components/ui";
import { getRequestErrorNotice } from "@/fetch";
import { useApplicationEnvironments } from "../hooks/use-application-environments";
import { useApplicationEnvironment } from "../hooks/use-application-environment";
import { useApplicationEnvironmentManagement } from "../hooks/use-application-environment-management";
import { SIGNING_ALGORITHMS } from "./connect-environment-form";
import "./environments-page.css";

const verificationSchema = z.object({
	verificationMessages: z.array(z.enum(["id_token", "userinfo"])).min(1),
	verificationSignatureAlgorithms: z
		.array(
			z.enum([
				"RS256",
				"RS384",
				"RS512",
				"PS256",
				"PS384",
				"PS512",
				"ES256",
				"ES384",
				"ES512",
			])
		)
		.min(1),
});

type VerificationFormValues = z.infer<typeof verificationSchema>;

const algorithmOptions = SIGNING_ALGORITHMS.map((value) => ({
	id: `verify-${value}`,
	label: value,
	value,
}));

export const EnvironmentMessagesVerifiedPage = (): FunctionComponent => {
	const { i18n, t } = useTranslation();
	const navigate = useNavigate({
		from: "/applications/$applicationUuid/environments/$environmentUuid/messages-verified",
	});
	const { applicationUuid, environmentUuid } = useParams({
		from: "/applications/$applicationUuid/environments/$environmentUuid/messages-verified",
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
		isUpdatingVerification,
		updateEnvironmentVerification,
		verificationUpdateError,
	} = useApplicationEnvironmentManagement(applicationUuid);
	const form = useForm<VerificationFormValues>({
		defaultValues: {
			verificationMessages: [],
			verificationSignatureAlgorithms: [],
		},
		mode: "onBlur",
		resolver: zodResolver(verificationSchema),
	});
	const {
		control,
		formState: { errors },
		handleSubmit,
		reset,
	} = form;

	useEffect(() => {
		if (!environment) {
			return;
		}

		reset({
			verificationMessages: environment.config?.verificationMessages ?? [],
			verificationSignatureAlgorithms:
				environment.config?.verificationSignatureAlgorithms ?? [],
		});
	}, [environment, reset]);

	const requestError = getRequestErrorNotice(verificationUpdateError, {
		bodyKey: "applicationEnvironmentManagement.updateVerificationErrorBody",
		titleKey: "applicationEnvironmentManagement.updateVerificationErrorTitle",
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
	const verificationMessagesErrorMessage = errors.verificationMessages
		? t("applicationEnvironmentConnect.stepFour.validationVerificationMessages")
		: undefined;
	const verificationAlgorithmsErrorMessage =
		errors.verificationSignatureAlgorithms
			? t(
					"applicationEnvironmentConnect.stepFour.validationVerificationAlgorithms"
				)
			: undefined;
	const errorLinks: Record<string, string> = {};
	if (verificationMessagesErrorMessage) {
		errorLinks["#verification-messages-control"] =
			verificationMessagesErrorMessage;
	}
	if (verificationAlgorithmsErrorMessage) {
		errorLinks["#verification-algorithms-control"] =
			verificationAlgorithmsErrorMessage;
	}
	const hasValidationErrors = Object.keys(errorLinks).length > 0;

	if (isEnvironmentLoading) {
		return (
			<Grid columns="1fr" tag="div">
				<Heading tag="h1">
					{t("applicationEnvironmentManagement.changeMessagesVerified")}
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
					{t("applicationEnvironmentManagement.changeMessagesVerified")}
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

	const onSubmit = async (values: VerificationFormValues): Promise<void> => {
		await updateEnvironmentVerification({
			environmentUuid,
			verificationMessages: values.verificationMessages,
			verificationSignatureAlgorithms: values.verificationSignatureAlgorithms,
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
					{t("applicationEnvironmentManagement.changeMessagesVerified")}
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
							{t("applicationEnvironmentManagement.verificationEditorIntro")}
						</Text>
						<Text>
							{t(
								"applicationEnvironmentManagement.verificationEditorLearnMore"
							)}
						</Text>
						<Fieldset
							legendSize="h3"
							legend={t(
								"applicationEnvironmentConnect.stepFour.verificationTitle"
							)}
						>
							<Controller
								control={control}
								name="verificationMessages"
								render={({ field }) => (
									<Checkboxes
										errorMessage={verificationMessagesErrorMessage}
										id="verification-messages-control"
										name={field.name}
										value={field.value}
										legend={t(
											"applicationEnvironmentConnect.stepFour.verificationMessages"
										)}
										options={[
											{
												id: "verify-id-token",
												label: t("applicationEnvironmentConnect.idToken"),
												value: "id_token",
											},
											{
												id: "verify-userinfo",
												label: t("applicationEnvironmentConnect.userinfo"),
												value: "userinfo",
											},
										]}
										onInput={(event) => {
											field.onChange(event.target.value);
										}}
									/>
								)}
							/>
							<Controller
								control={control}
								name="verificationSignatureAlgorithms"
								render={({ field }) => (
									<Checkboxes
										errorMessage={verificationAlgorithmsErrorMessage}
										id="verification-algorithms-control"
										name={field.name}
										options={algorithmOptions}
										value={field.value}
										legend={t(
											"applicationEnvironmentConnect.stepFour.verificationAlgorithms"
										)}
										onInput={(event) => {
											field.onChange(event.target.value);
										}}
									/>
								)}
							/>
						</Fieldset>
						<div className="connect-environment-actions">
							<Grid alignItems="center" columns="auto auto 1fr" tag="div">
								<Button disabled={isUpdatingVerification} type="submit">
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
