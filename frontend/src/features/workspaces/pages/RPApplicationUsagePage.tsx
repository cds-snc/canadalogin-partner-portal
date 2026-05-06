import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import type { FunctionComponent } from "@/common/types";
import { Breadcrumbs, CenteredPageLayout } from "@/components/layout";
import { Button, DateInput, Heading, Notice, Text } from "@/components/ui";
import { useToast } from "@/components/ui/Toast";
import { getRequestErrorMessage, getRequestErrorNotice } from "@/fetch";
import {
	getCurrentUserWorkspaces,
	getRPApplications,
	getRPApplicationUsageAuditTrail,
	getRPApplicationUsageAuditTrailSearchAfter,
	getRPApplicationUsageSummary,
	type RPApplicationUsageAuditEventRead,
} from "@/fetch/workspaces";

const detailCardClasses =
	"rounded-sm border border-[var(--gcds-border-default)] bg-[var(--gcds-bg-white)] px-400 py-350 shadow-[0_14px_28px_rgba(38,55,74,0.06)]";

const toIsoDate = (value: Date): string => {
	const year = value.getFullYear();
	const month = String(value.getMonth() + 1).padStart(2, "0");
	const day = String(value.getDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
};

const shiftDays = (value: Date, days: number): Date => {
	const nextDate = new Date(value);
	nextDate.setDate(nextDate.getDate() + days);
	return nextDate;
};

const getDateValidationMessage = (
	selectedDate: string,
	minDate: string,
	maxDate: string,
	t: (key: string | Array<string>, opts?: Record<string, unknown>) => string
): string => {
	const trimmedDate = selectedDate.trim();
	if (!trimmedDate || trimmedDate < minDate || trimmedDate > maxDate) {
		return t("workspaces.applicationUsageDateError");
	}

	return "";
};

const formatEventTime = (
	timeSeconds: number | null,
	language: string
): string => {
	if (!timeSeconds) {
		return "-";
	}

	return new Intl.DateTimeFormat(
		language.startsWith("fr") ? "fr-CA" : "en-CA",
		{
			hour: "2-digit",
			minute: "2-digit",
			second: "2-digit",
		}
	).format(new Date(timeSeconds * 1000));
};

type SummaryCardProps = {
	label: string;
	value: number;
};

const SummaryCard = ({ label, value }: SummaryCardProps): FunctionComponent => (
	<div
		className={`${detailCardClasses} flex min-w-[12rem] flex-1 flex-col gap-100`}
	>
		<Text marginBottom="0" textRole="secondary">
			{label}
		</Text>
		<Heading marginBottom="0" tag="h2">
			{String(value)}
		</Heading>
	</div>
);

type EventCardProps = {
	event: RPApplicationUsageAuditEventRead;
	language: string;
	unknownUserLabel: string;
	labels: {
		country: string;
		ipVersion: string;
		origin: string;
		result: string;
		time: string;
		user: string;
	};
};

const EventCard = ({
	event,
	language,
	unknownUserLabel,
	labels,
}: EventCardProps): FunctionComponent => {
	const userDisplay = event.usernameKnown
		? event.usernameDisplay || event.username
		: unknownUserLabel;

	return (
		<div className={`${detailCardClasses} flex flex-col gap-150`}>
			<div className="grid gap-200 md:grid-cols-2">
				<div>
					<Text marginBottom="50" size="small" textRole="secondary">
						{labels.user}
					</Text>
					<Text marginBottom="0">{userDisplay}</Text>
				</div>
				<div>
					<Text marginBottom="50" size="small" textRole="secondary">
						{labels.time}
					</Text>
					<Text marginBottom="0">
						{formatEventTime(event.timeSeconds, language)}
					</Text>
				</div>
				<div>
					<Text marginBottom="50" size="small" textRole="secondary">
						{labels.origin}
					</Text>
					<Text marginBottom="0">
						{event.originDisplay || event.origin || "-"}
					</Text>
				</div>
				<div>
					<Text marginBottom="50" size="small" textRole="secondary">
						{labels.result}
					</Text>
					<Text marginBottom="0">{event.result || "-"}</Text>
				</div>
				<div>
					<Text marginBottom="50" size="small" textRole="secondary">
						{labels.ipVersion}
					</Text>
					<Text marginBottom="0">
						{event.ipVersion ? String(event.ipVersion) : "-"}
					</Text>
				</div>
				<div>
					<Text marginBottom="50" size="small" textRole="secondary">
						{labels.country}
					</Text>
					<Text marginBottom="0">{event.country || "-"}</Text>
				</div>
			</div>
		</div>
	);
};

export const RPApplicationUsagePage = (): FunctionComponent => {
	const { t, i18n } = useTranslation() as unknown as {
		t: (key: string | Array<string>, opts?: Record<string, unknown>) => string;
		i18n: { language: string };
	};
	const { rpApplicationUuid, workspaceUuid } = useParams({
		from: "/workspaces/$workspaceUuid/applications/$rpApplicationUuid/usage",
	});
	const navigate = useNavigate();
	const toast = useToast();
	const today = useMemo(() => new Date(), []);
	const maxDate = useMemo(() => toIsoDate(today), [today]);
	const minDate = useMemo(() => toIsoDate(shiftDays(today, -89)), [today]);
	const [draftDate, setDraftDate] = useState<string>(maxDate);
	const [selectedDate, setSelectedDate] = useState<string>(maxDate);
	const [dateErrorMessage, setDateErrorMessage] = useState<string>("");
	const [events, setEvents] = useState<Array<RPApplicationUsageAuditEventRead>>(
		[]
	);
	const [nextCursor, setNextCursor] = useState<string | null>(null);
	const [isLoadingMore, setIsLoadingMore] = useState(false);

	const {
		data: workspace,
		error: workspaceQueryError,
		isError: isWorkspaceError,
		isLoading: isWorkspaceLoading,
	} = useQuery({
		queryKey: ["workspace", workspaceUuid],
		queryFn: () =>
			getCurrentUserWorkspaces().then((workspaces) =>
				workspaces.find((workspaceItem) => workspaceItem.uuid === workspaceUuid)
			),
		enabled: !!workspaceUuid,
	});

	const {
		data: applications,
		error: applicationsQueryError,
		isError: isApplicationsError,
		isLoading: isApplicationsLoading,
	} = useQuery({
		queryKey: ["workspace-applications", workspaceUuid],
		queryFn: () => getRPApplications(workspaceUuid),
		enabled: !!workspaceUuid,
	});

	const application =
		applications?.find((item) => item.uuid === rpApplicationUuid) ?? null;

	const {
		data: summary,
		error: summaryQueryError,
		isError: isSummaryError,
		isFetching: isSummaryFetching,
		isLoading: isSummaryLoading,
		refetch: refetchSummary,
	} = useQuery({
		queryKey: [
			"rp-application-usage-summary",
			workspaceUuid,
			rpApplicationUuid,
			selectedDate,
		],
		queryFn: () =>
			getRPApplicationUsageSummary(
				workspaceUuid,
				rpApplicationUuid,
				selectedDate
			),
		enabled: !!workspaceUuid && !!rpApplicationUuid,
	});

	const {
		data: auditTrail,
		error: auditTrailQueryError,
		isError: isAuditTrailError,
		isFetching: isAuditTrailFetching,
		isLoading: isAuditTrailLoading,
		refetch: refetchAuditTrail,
	} = useQuery({
		queryKey: [
			"rp-application-usage-audit-trail",
			workspaceUuid,
			rpApplicationUuid,
			selectedDate,
		],
		queryFn: () =>
			getRPApplicationUsageAuditTrail(workspaceUuid, rpApplicationUuid, {
				selectedDate,
				size: 25,
			}),
		enabled: !!workspaceUuid && !!rpApplicationUuid,
	});

	useEffect(() => {
		setEvents(auditTrail?.events ?? []);
		setNextCursor(auditTrail?.next ?? null);
	}, [auditTrail]);

	const workspaceErrorNotice = getRequestErrorNotice(
		workspaceQueryError as Error | null | undefined,
		{
			bodyKey: "workspaces.errorLoading",
			titleKey: "workspaces.errorLoading",
		}
	);
	const applicationsErrorNotice = getRequestErrorNotice(
		applicationsQueryError as Error | null | undefined,
		{
			bodyKey: "workspaces.errorLoadingApplications",
			titleKey: "workspaces.errorLoadingApplications",
		}
	);
	const usageErrorNotice = getRequestErrorNotice(
		(summaryQueryError as Error | null | undefined) ??
			(auditTrailQueryError as Error | null | undefined),
		{
			bodyKey: "workspaces.applicationUsageError",
			titleKey: "workspaces.applicationUsageErrorTitle",
		}
	);

	const handleBackToApplication = (): void => {
		void navigate({
			params: { rpApplicationUuid, workspaceUuid },
			to: "/workspaces/$workspaceUuid/applications/$rpApplicationUuid",
		});
	};

	const handleDateChange = (nextValue: string): void => {
		setDraftDate(nextValue);
		if (dateErrorMessage) {
			setDateErrorMessage("");
		}
	};

	const handleSearch = (): void => {
		const validationMessage = getDateValidationMessage(
			draftDate,
			minDate,
			maxDate,
			t
		);
		if (validationMessage) {
			setDateErrorMessage(validationMessage);
			return;
		}

		setDateErrorMessage("");
		if (draftDate === selectedDate) {
			void refetchSummary();
			void refetchAuditTrail();
			return;
		}

		setSelectedDate(draftDate);
	};

	const handleLoadMore = async (): Promise<void> => {
		if (!nextCursor || isLoadingMore) {
			return;
		}

		setIsLoadingMore(true);
		try {
			const response = await getRPApplicationUsageAuditTrailSearchAfter(
				workspaceUuid,
				rpApplicationUuid,
				{
					searchAfter: nextCursor,
					selectedDate,
					size: 25,
				}
			);
			setEvents((currentEvents) => [...currentEvents, ...response.events]);
			setNextCursor(response.next ?? null);
		} catch (error) {
			toast.error(getRequestErrorMessage(error, t("errors.serverBody")));
		} finally {
			setIsLoadingMore(false);
		}
	};

	if (
		isWorkspaceLoading ||
		isApplicationsLoading ||
		isSummaryLoading ||
		isAuditTrailLoading
	) {
		return (
			<CenteredPageLayout className="max-w-5xl">
				<Text>{t("workspaces.loadingApplications")}</Text>
			</CenteredPageLayout>
		);
	}

	if (isWorkspaceError || !workspace) {
		return (
			<CenteredPageLayout className="max-w-5xl">
				<Notice
					noticeRole={workspaceErrorNotice?.noticeRole ?? "danger"}
					noticeTitleTag="h2"
					noticeTitle={t(
						(workspaceErrorNotice?.titleKey ??
							"workspaces.errorLoading") as never
					)}
				>
					<Text>
						{workspaceErrorNotice?.bodyText ??
							t(
								(workspaceErrorNotice?.bodyKey ??
									"workspaces.errorLoading") as never
							)}
					</Text>
				</Notice>
			</CenteredPageLayout>
		);
	}

	if (isApplicationsError || !application) {
		return (
			<CenteredPageLayout className="max-w-5xl">
				<Notice
					noticeRole={applicationsErrorNotice?.noticeRole ?? "danger"}
					noticeTitleTag="h2"
					noticeTitle={t(
						(applicationsErrorNotice?.titleKey ??
							"workspaces.errorLoadingApplications") as never
					)}
				>
					<Text>
						{applicationsErrorNotice?.bodyText ??
							t(
								(applicationsErrorNotice?.bodyKey ??
									"workspaces.errorLoadingApplications") as never
							)}
					</Text>
				</Notice>
			</CenteredPageLayout>
		);
	}

	if (isSummaryError || isAuditTrailError) {
		return (
			<CenteredPageLayout className="max-w-5xl">
				<Notice
					noticeRole={usageErrorNotice?.noticeRole ?? "danger"}
					noticeTitleTag="h2"
					noticeTitle={t(
						(usageErrorNotice?.titleKey ??
							"workspaces.applicationUsageErrorTitle") as never
					)}
				>
					<Text>
						{usageErrorNotice?.bodyText ??
							t(
								(usageErrorNotice?.bodyKey ??
									"workspaces.applicationUsageError") as never
							)}
					</Text>
				</Notice>
			</CenteredPageLayout>
		);
	}

	return (
		<CenteredPageLayout className="max-w-5xl gap-400">
			<Breadcrumbs
				items={[
					{ href: "/", label: t("nav.home") },
					{ href: "/workspaces", label: t("workspaces.title") },
					{ href: `/workspaces/${workspaceUuid}`, label: workspace.name },
					{
						href: `/workspaces/${workspaceUuid}/applications/${rpApplicationUuid}`,
						label: application.name,
					},
					{
						href: `/workspaces/${workspaceUuid}/applications/${rpApplicationUuid}/usage`,
						label: t("workspaces.applicationUsageBreadcrumb"),
					},
				]}
			/>

			<div className="flex flex-col gap-300">
				<div className="flex flex-col gap-200 md:flex-row md:items-start md:justify-between">
					<div>
						<Heading tag="h1">
							{t("workspaces.applicationUsageTitle", {
								name: application.name,
							})}
						</Heading>
						<Text>{t("workspaces.applicationUsageSummary")}</Text>
					</div>
					<Button
						buttonRole="secondary"
						type="button"
						onGcdsClick={handleBackToApplication}
					>
						{t("workspaces.applicationUsageBack")}
					</Button>
				</div>

				<div className={detailCardClasses}>
					<div className="flex flex-col gap-200 md:flex-row md:items-end">
						<div className="flex-1">
							<DateInput
								required
								errorMessage={dateErrorMessage || undefined}
								format="full"
								hint={t("workspaces.applicationUsageDateHint")}
								lang={i18n.language.startsWith("fr") ? "fr" : "en"}
								legend={t("workspaces.applicationUsageDateLabel")}
								max={maxDate}
								min={minDate}
								name="application-usage-date"
								validateOn="submit"
								value={draftDate}
								onInput={(event) => {
									handleDateChange(
										(
											(event.target as HTMLInputElement | null)?.value ?? ""
										).trim()
									);
								}}
							/>
						</div>
						<div className="md:pb-[0.35rem]">
							<Button
								disabled={isSummaryFetching || isAuditTrailFetching}
								type="button"
								onGcdsClick={handleSearch}
							>
								{t("workspaces.applicationUsageSearch")}
							</Button>
						</div>
					</div>
				</div>

				<div className="flex flex-col gap-200 md:flex-row">
					<SummaryCard
						label={t("workspaces.applicationUsageTotal")}
						value={summary?.total ?? 0}
					/>
					<SummaryCard
						label={t("workspaces.applicationUsageSucceeded")}
						value={summary?.succeeded ?? 0}
					/>
					<SummaryCard
						label={t("workspaces.applicationUsageFailed")}
						value={summary?.failed ?? 0}
					/>
				</div>

				<section className="flex flex-col gap-200">
					{events.length > 0 ? (
						events.map((event, index) => (
							<EventCard
								key={`${event.timeSeconds ?? 0}-${event.username}-${event.origin}-${index}`}
								event={event}
								language={i18n.language}
								unknownUserLabel={t("workspaces.applicationUsageUnknownUser")}
								labels={{
									country: t("workspaces.applicationUsageCountry"),
									ipVersion: t("workspaces.applicationUsageIpVersion"),
									origin: t("workspaces.applicationUsageOrigin"),
									result: t("workspaces.applicationUsageResult"),
									time: t("workspaces.applicationUsageTime"),
									user: t("workspaces.applicationUsageUser"),
								}}
							/>
						))
					) : (
						<div className={detailCardClasses}>
							<Text marginBottom="0">
								{t("workspaces.applicationUsageNoEvents")}
							</Text>
						</div>
					)}
				</section>

				{nextCursor ? (
					<div className="flex justify-end">
						<Button type="button" onGcdsClick={() => void handleLoadMore()}>
							{isLoadingMore
								? t("workspaces.applicationUsageLoadingMore")
								: t("workspaces.applicationUsageLoadMore")}
						</Button>
					</div>
				) : null}
			</div>
		</CenteredPageLayout>
	);
};
