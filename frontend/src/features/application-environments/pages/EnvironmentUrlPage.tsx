import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, useParams } from "@tanstack/react-router";
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
import "./environments-page.css";

const environmentUrlSchema = z.object({
	applicationUrl: z.string().url(),
});

type EnvironmentUrlFormValues = z.infer<typeof environmentUrlSchema>;
export type EnvironmentUrlLanguage = "en" | "fr";

type EnvironmentUrlPageProps = {
	language: EnvironmentUrlLanguage;
};

type EnvironmentUrlConfig = {
	configKey: "applicationUrlEn" | "applicationUrlFr";
	errorKey:
		| "applicationEnvironments.connect.validationEnglishUrl"
		| "applicationEnvironments.connect.validationFrenchUrl";
	hintKey?: "applicationEnvironmentConnect.stepOne.applicationUrlFrHint";
	hostId: "application-url-en-control" | "application-url-fr-control";
	inputId: "application-url-en" | "application-url-fr";
	labelKey:
		| "applicationEnvironmentConnect.stepOne.applicationUrlEn"
		| "applicationEnvironmentConnect.stepOne.applicationUrlFr";
	titleKey:
		| "applicationEnvironmentManagement.changeEnglishUrl"
		| "applicationEnvironmentManagement.changeFrenchUrl";
};

const URL_CONFIG: Record<EnvironmentUrlLanguage, EnvironmentUrlConfig> = {
	en: {
		configKey: "applicationUrlEn",
		errorKey: "applicationEnvironments.connect.validationEnglishUrl",
		hostId: "application-url-en-control",
		inputId: "application-url-en",
		labelKey: "applicationEnvironmentConnect.stepOne.applicationUrlEn",
		titleKey: "applicationEnvironmentManagement.changeEnglishUrl",
	},
	fr: {
		configKey: "applicationUrlFr",
		errorKey: "applicationEnvironments.connect.validationFrenchUrl",
		hintKey: "applicationEnvironmentConnect.stepOne.applicationUrlFrHint",
		hostId: "application-url-fr-control",
		inputId: "application-url-fr",
		labelKey: "applicationEnvironmentConnect.stepOne.applicationUrlFr",
		titleKey: "applicationEnvironmentManagement.changeFrenchUrl",
	},
};

const inputValue = (event: FormEvent<Element>): string =>
	(event.target as HTMLInputElement).value;

export const EnvironmentUrlPage = ({
	language,
}: EnvironmentUrlPageProps): FunctionComponent => {
	const { i18n, t } = useTranslation();
	const navigate = useNavigate();
	const params = useParams({ strict: false });
	const applicationUuid = params.applicationUuid ?? "";
	const environmentUuid = params.environmentUuid ?? "";
	const config = URL_CONFIG[language];
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
	const { isUpdatingUrl, updateEnvironmentUrl, urlUpdateError } =
		useApplicationEnvironmentManagement(applicationUuid);
	const form = useForm<EnvironmentUrlFormValues>({
		defaultValues: { applicationUrl: "" },
		mode: "onBlur",
		resolver: zodResolver(environmentUrlSchema),
	});
	const {
		control,
		formState: { errors },
		handleSubmit,
		reset,
	} = form;
	const { field } = useController({ control, name: "applicationUrl" });

	useEffect(() => {
		if (!environment) {
			return;
		}

		reset({ applicationUrl: environment.config?.[config.configKey] ?? "" });
	}, [config.configKey, environment, reset]);

	const requestError = getRequestErrorNotice(urlUpdateError, {
		bodyKey: "applicationEnvironmentManagement.updateUrlErrorBody",
		titleKey: "applicationEnvironmentManagement.updateUrlErrorTitle",
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
	const errorMessage = errors.applicationUrl ? t(config.errorKey) : undefined;
	const errorLinks = errorMessage
		? { [`#${config.hostId}`]: errorMessage }
		: {};
	const hasValidationErrors = Object.keys(errorLinks).length > 0;
	const fieldLabel = t(config.labelKey);
	const fieldHint = config.hintKey ? t(config.hintKey) : undefined;

	if (isEnvironmentLoading) {
		return (
			<Grid columns="1fr" tag="div">
				<Heading tag="h1">{t(config.titleKey)}</Heading>
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
				<Heading tag="h1">{t(config.titleKey)}</Heading>
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
		applicationUrl,
	}: EnvironmentUrlFormValues): Promise<void> => {
		const payload =
			language === "en"
				? { applicationUrlEn: applicationUrl }
				: { applicationUrlFr: applicationUrl };
		await updateEnvironmentUrl({ ...payload, environmentUuid });
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
				<Heading tag="h1">{t(config.titleKey)}</Heading>
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
						<Input
							required
							errorMessage={errorMessage}
							hint={fieldHint}
							id={config.hostId}
							inputId={config.inputId}
							label={fieldLabel}
							name={field.name}
							value={field.value}
							onInput={(event) => {
								field.onChange(inputValue(event));
							}}
						/>
						<div className="connect-environment-actions">
							<Grid alignItems="center" columns="auto auto 1fr" tag="div">
								<Button disabled={isUpdatingUrl} type="submit">
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
