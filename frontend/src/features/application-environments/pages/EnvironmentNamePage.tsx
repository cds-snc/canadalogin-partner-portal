import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, useParams } from "@tanstack/react-router";
import { GcdsHint, GcdsLabel } from "@gcds-core/components-react";
import { useEffect, type FormEvent } from "react";
import { useController, useForm } from "react-hook-form";
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
	Text,
} from "@/components/ui";
import { getRequestErrorNotice } from "@/fetch";
import { useApplicationEnvironments } from "../hooks/use-application-environments";
import { useApplicationEnvironment } from "../hooks/use-application-environment";
import { useApplicationEnvironmentManagement } from "../hooks/use-application-environment-management";
import {
	environmentNameSchema,
	isEnvironmentNameWithinLimit,
	stripEnvironmentTypePrefix,
} from "./connect-environment-form";
import "./environments-page.css";

const environmentNameEditSchema = z
	.object({
		environmentName: environmentNameSchema,
		tenantCode: z.string().min(1),
	})
	.superRefine((values, context) => {
		if (
			!isEnvironmentNameWithinLimit(values.environmentName, values.tenantCode)
		) {
			context.addIssue({
				code: "custom",
				message: "environmentName",
				path: ["environmentName"],
			});
		}
	});

type EnvironmentNameFormValues = z.infer<typeof environmentNameEditSchema>;

const inputValue = (event: FormEvent<Element>): string =>
	(event.target as HTMLInputElement).value;

export const EnvironmentNamePage = (): FunctionComponent => {
	const { i18n, t } = useTranslation();
	const navigate = useNavigate({
		from: "/applications/$applicationUuid/environments/$environmentUuid/environment-name",
	});
	const { applicationUuid, environmentUuid } = useParams({
		from: "/applications/$applicationUuid/environments/$environmentUuid/environment-name",
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
	const { isUpdatingName, updateEnvironmentName, updateError } =
		useApplicationEnvironmentManagement(applicationUuid);
	const form = useForm<EnvironmentNameFormValues>({
		defaultValues: {
			environmentName: "",
			tenantCode: "",
		},
		mode: "onBlur",
		resolver: zodResolver(environmentNameEditSchema),
	});
	const {
		control,
		handleSubmit,
		formState: { errors },
		reset,
	} = form;
	const { field } = useController({ control, name: "environmentName" });

	useEffect(() => {
		if (!environment) {
			return;
		}

		reset({
			environmentName: stripEnvironmentTypePrefix(
				environment.config?.environmentName ?? environment.partnerLabel
			),
			tenantCode: environment.tenantCode,
		});
	}, [environment, reset]);

	const requestError = getRequestErrorNotice(updateError, {
		bodyKey: "applicationEnvironmentManagement.updateErrorBody",
		titleKey: "applicationEnvironmentManagement.updateErrorTitle",
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
	const errorMessage = errors.environmentName
		? t("applicationEnvironments.connect.validationEnvironmentName")
		: undefined;
	const errorLinks: Record<string, string> = {};
	if (errorMessage) {
		errorLinks["#environment-name-control"] = errorMessage;
	}
	const hasValidationErrors = Object.keys(errorLinks).length > 0;
	const environmentNameLabel = t(
		"applicationEnvironmentConnect.stepOne.environmentName"
	);
	const environmentNameHint = t(
		"applicationEnvironmentConnect.stepOne.environmentNameHint"
	);

	if (isEnvironmentLoading) {
		return (
			<Grid columns="1fr" tag="div">
				<Heading tag="h1">
					{t("applicationEnvironmentManagement.changeEnvironmentName")}
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
					{t("applicationEnvironmentManagement.changeEnvironmentName")}
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
		environmentName,
	}: EnvironmentNameFormValues): Promise<void> => {
		await updateEnvironmentName({ environmentName, environmentUuid });
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
					{t("applicationEnvironmentManagement.changeEnvironmentName")}
				</Heading>
				{hasValidationErrors ? (
					<ErrorSummary
						errorLinks={errorLinks}
						listen={false}
					/>
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
						<GcdsLabel
							required
							className="environment-name-label"
							label={environmentNameLabel}
							labelFor="environment-name-control"
						/>
						<GcdsHint hintId="environment-name">{environmentNameHint}</GcdsHint>
						<Grid alignItems="end" columns="auto 1fr" tag="div">
							<Text marginBottom="100" size="body">
								{environment.tenantCode === "staging" ? "STAGING-" : "TEST-"}
							</Text>
							<Input
								hideLabel
								required
								ariaDescribedBy="hint-environment-name"
								className="environment-name-input"
								errorMessage={errorMessage}
								id="environment-name-control"
								inputId="environment-name"
								label={environmentNameLabel}
								name={field.name}
								value={field.value}
								onInput={(event) => {
									field.onChange(inputValue(event));
								}}
							/>
						</Grid>
						<div className="connect-environment-actions">
							<Grid alignItems="center" columns="auto auto 1fr" tag="div">
								<Button disabled={isUpdatingName} type="submit">
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
