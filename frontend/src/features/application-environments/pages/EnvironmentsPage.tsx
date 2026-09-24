import { useNavigate, useParams, useSearch } from "@tanstack/react-router";
import type { CSSProperties } from "react";
import { useTranslation } from "react-i18next";
import type { FunctionComponent } from "@/common/types";
import {
	Button,
	Card,
	Details,
	Grid,
	Heading,
	Icon,
	Link,
	Notice,
	Pagination,
	Text,
} from "@/components/ui";
import { getRequestErrorNotice } from "@/fetch";
import { useApplicationEnvironments } from "../hooks/use-application-environments";

const ITEMS_PER_PAGE = 10;

export const EnvironmentsPage = (): FunctionComponent => {
	const { i18n, t } = useTranslation();
	const navigate = useNavigate({
		from: "/applications/$applicationUuid/environments",
	});
	const { applicationUuid } = useParams({
		from: "/applications/$applicationUuid/environments",
	});
	const { page = 1 } = useSearch({
		from: "/applications/$applicationUuid/environments",
	});
	const { data, error, isLoading } = useApplicationEnvironments(
		applicationUuid,
		page,
		ITEMS_PER_PAGE
	);
	const errorNotice = getRequestErrorNotice(error, {
		bodyKey: "applicationEnvironments.errorBody",
		titleKey: "applicationEnvironments.errorTitle",
	});

	if (isLoading) {
		return (
			<Grid columns="1fr" tag="div">
				<Heading tag="h1">{t("applicationEnvironments.title")}</Heading>
				<Notice
					noticeRole="info"
					noticeTitle={t("applicationEnvironments.loadingTitle")}
					noticeTitleTag="h2"
				>
					<Text>{t("applicationEnvironments.loadingBody")}</Text>
				</Notice>
			</Grid>
		);
	}

	if (errorNotice || !data) {
		return (
			<Grid columns="1fr" tag="div">
				<Heading tag="h1">{t("applicationEnvironments.title")}</Heading>
				<Notice
					noticeRole={errorNotice?.noticeRole ?? "danger"}
					noticeTitleTag="h2"
					noticeTitle={
						errorNotice
							? t(errorNotice.titleKey as never)
							: t("applicationEnvironments.errorTitle")
					}
				>
					<Text>
						{errorNotice
							? errorNotice.bodyText ?? t(errorNotice.bodyKey as never)
							: t("applicationEnvironments.errorBody")}
					</Text>
				</Notice>
			</Grid>
		);
	}

	const applicationName =
		i18n.resolvedLanguage === "fr" && data.application.nameFr
			? data.application.nameFr
			: data.application.nameEn;
	const hasEnvironments = data.data.length > 0;
	const totalPages = Math.ceil(data.totalCount / data.itemsPerPage);
	const dateFormatter = new Intl.DateTimeFormat(i18n.resolvedLanguage ?? "en", {
		day: "numeric",
		month: "long",
		year: "numeric",
	});

	return (
		<Grid columns="1fr" tag="div">
			<div className="flex items-center gap-100">
				<Text marginBottom="0">
					<strong>{applicationName}</strong>
				</Text>
				<span className="inline-flex rotate-90">
					<Icon name="arrow-up-down" size="text" />
				</span>
				<Link href="#">{t("applicationEnvironments.switchApplication")}</Link>
			</div>
			<Heading tag="h1">{t("applicationEnvironments.title")}</Heading>
			<Text>{t("applicationEnvironments.summary")}</Text>
			<Text>
				{t("applicationEnvironments.gettingStartedPrefix")}
				<Link href="#">{t("applicationEnvironments.gettingStartedLink")}</Link>
			</Text>
			<div>
				<Button type="button">
					{t("applicationEnvironments.connectAction")}
				</Button>
			</div>
			<Heading tag="h2">
				{t("applicationEnvironments.sectionTitle")}
			</Heading>

			{hasEnvironments ? (
				<>
					<Details
						open
						detailsTitle={t("applicationEnvironments.productionStatuses")}
					>
						<Text>
							<strong>{t("applicationEnvironments.statusSubmitted")}:</strong>{" "}
							{t("applicationEnvironments.submittedDescription")}
						</Text>
						<Text>
							<strong>{t("applicationEnvironments.statusInProduction")}:</strong>{" "}
							{t("applicationEnvironments.inProductionDescription")}
						</Text>
					</Details>
					<Grid columns="1fr" tag="div">
						{data.data.map((environment) => {
							const isSubmitted = environment.statusCode === "submitted";
							const isInProduction =
								environment.statusCode === "published" &&
								environment.tenantCode === "production";
							const statusLabel = isSubmitted
								? t("applicationEnvironments.statusSubmitted")
								: isInProduction
									? t("applicationEnvironments.statusInProduction")
									: null;
							const modifiedAt =
								environment.updatedAt ?? environment.createdAt;
							const cardStyle: CSSProperties | undefined = isInProduction
								? {
									"--gcds-card-badge-background-color":
										"var(--gcds-color-green-700)",
								}
								: undefined;
							return (
								<Card
									key={environment.uuid}
									badge={statusLabel ?? undefined}
									cardTitle={environment.partnerLabel}
									cardTitleTag="h3"
									description={`${t("applicationEnvironments.lastModified")}: ${dateFormatter.format(new Date(modifiedAt))}`}
									href="#"
									style={cardStyle}
								/>
							);
						})}
					</Grid>
					<Pagination
						currentPage={data.page}
						label={t("applicationEnvironments.paginationLabel")}
						totalPages={totalPages}
						onPageChange={(nextPage) => {
							void navigate({ search: { page: nextPage } });
						}}
					/>
				</>
			) : (
				<Text>{t("applicationEnvironments.empty")}</Text>
			)}
		</Grid>
	);
};