import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import type { FunctionComponent } from "@/common/types";
import { Button, Grid, Heading, Notice, Text } from "@/components/ui";
import { getRequestErrorNotice } from "@/fetch";
import { getWorkspaceOnboardingStateLabel } from "@/features/workspaces/onboarding-display";
import { useOnboardingOversightQueue } from "../hooks/use-onboarding-oversight-queue";

type Translate = (
	key: string | Array<string>,
	options?: Record<string, unknown>
) => string;

type SummaryCard = {
	body: string;
	href: string;
	label: string;
	title: string;
};

const formatLastActivity = (value: string | null | undefined, language: string): string => {
	if (!value) {
		return "-";
	}

	const parsedValue = new Date(value);
	if (Number.isNaN(parsedValue.getTime())) {
		return value;
	}

	return parsedValue.toLocaleString(language, {
		dateStyle: "medium",
		timeStyle: "short",
	});
};

const getStateLink = (state: string): string =>
	`/onboarding-oversight/queue?onboardingState=${encodeURIComponent(state)}`;

export const OnboardingOversightPage = (): FunctionComponent => {
	const { i18n, t } = useTranslation() as unknown as {
		i18n: { resolvedLanguage?: string };
		t: Translate;
	};
	const { error, isLoading, isRefetching, queueRows } = useOnboardingOversightQueue({});
	const errorNotice = getRequestErrorNotice(error, {
		bodyKey: "onboardingOversight.overview.errorBody",
		titleKey: "onboardingOversight.overview.errorTitle",
	});
	const language = i18n.resolvedLanguage ?? "en";

	const summaryCards = useMemo<Array<SummaryCard>>(() => {
		const submittedCount = queueRows.filter(
			(row) => row.onboardingState === "submitted"
		).length;
		const underReviewCount = queueRows.filter(
			(row) => row.onboardingState === "under_review"
		).length;
		const productionProgressionCount = queueRows.filter(
			(row) => row.recordType === "production_progression"
		).length;
		const activeWorkspaceCount = new Set(
			queueRows.map((row) => row.workspaceUuid)
		).size;

		return [
			{
				body: t("onboardingOversight.overview.submittedBody", {
					count: submittedCount,
				}),
				href: getStateLink("submitted"),
				label: t("onboardingOversight.overview.openFilteredQueueAction"),
				title: t("onboardingOversight.overview.submittedTitle", {
					count: submittedCount,
				}),
			},
			{
				body: t("onboardingOversight.overview.underReviewBody", {
					count: underReviewCount,
				}),
				href: getStateLink("under_review"),
				label: t("onboardingOversight.overview.openFilteredQueueAction"),
				title: t("onboardingOversight.overview.underReviewTitle", {
					count: underReviewCount,
				}),
			},
			{
				body: t("onboardingOversight.overview.productionProgressionBody", {
					count: productionProgressionCount,
				}),
				href: "/onboarding-oversight/queue?recordType=production_progression",
				label: t("onboardingOversight.overview.openFilteredQueueAction"),
				title: t("onboardingOversight.overview.productionProgressionTitle", {
					count: productionProgressionCount,
				}),
			},
			{
				body: t("onboardingOversight.overview.workspaceCoverageBody", {
					count: activeWorkspaceCount,
				}),
				href: "/onboarding-oversight/queue",
				label: t("onboardingOversight.overview.openQueueAction"),
				title: t("onboardingOversight.overview.workspaceCoverageTitle", {
					count: activeWorkspaceCount,
				}),
			},
		];
	}, [queueRows, t]);

	const recentRows = useMemo(
		() => queueRows.slice(0, 5),
		[queueRows]
	);

	return (
		<Grid columns="1fr" tag="div">
			<Heading tag="h1">{t("onboardingOversight.overview.pageTitle")}</Heading>
			<Text>{t("onboardingOversight.overview.summary")}</Text>

			<Notice
				noticeRole="info"
				noticeTitle={t("onboardingOversight.overview.accessNoticeTitle")}
				noticeTitleTag="h2"
			>
				<Text>{t("onboardingOversight.overview.accessNoticeBody")}</Text>
			</Notice>

			{isLoading || isRefetching ? (
				<Notice
					noticeRole="info"
					noticeTitle={t("onboardingOversight.overview.loadingTitle")}
					noticeTitleTag="h2"
				>
					<Text>{t("onboardingOversight.overview.loadingBody")}</Text>
				</Notice>
			) : null}

			{errorNotice ? (
				<Notice
					noticeRole={errorNotice.noticeRole}
					noticeTitle={t(errorNotice.titleKey)}
					noticeTitleTag="h2"
				>
					<Text>{errorNotice.bodyText ?? t(errorNotice.bodyKey)}</Text>
				</Notice>
			) : null}

			{!isLoading && !errorNotice ? (
				<>
					{queueRows.length === 0 ? (
						<Notice
							noticeRole="info"
							noticeTitle={t("onboardingOversight.overview.emptyTitle")}
							noticeTitleTag="h2"
						>
							<Text>{t("onboardingOversight.overview.emptyBody")}</Text>
						</Notice>
					) : (
						<>
							<div className="grid gap-300 md:grid-cols-2">
								{summaryCards.map((card) => (
									<section
										key={card.title}
										className="grid gap-200 rounded-sm border border-[var(--gcds-border-default)] bg-[var(--gcds-bg-white)] p-300"
									>
										<Heading tag="h2">{card.title}</Heading>
										<Text>{card.body}</Text>
										<div>
											<Button href={card.href} type="link">
												{card.label}
											</Button>
										</div>
									</section>
								))}
							</div>

							<section className="grid gap-200 rounded-sm border border-[var(--gcds-border-default)] bg-[var(--gcds-bg-white)] p-300">
								<div className="flex flex-wrap items-center justify-between gap-200">
									<Heading tag="h2">
										{t("onboardingOversight.overview.recentActivityTitle")}
									</Heading>
									<Button href="/onboarding-oversight/queue" type="link">
										{t("onboardingOversight.overview.openQueueAction")}
									</Button>
								</div>
								<Text>{t("onboardingOversight.overview.recentActivityBody")}</Text>
								<ul className="grid gap-200">
									{recentRows.map((row) => (
										<li key={`${row.recordType}-${row.recordUuid}`}>
											<Button href={row.detailPath} type="link">
												{row.primaryRecordLabel}
											</Button>
											<Text>
												{t("onboardingOversight.overview.recentActivityRow", {
													lastActivityAt: formatLastActivity(
														row.lastActivityAt,
														language
													),
													onboardingState: getWorkspaceOnboardingStateLabel(
														t,
														row.onboardingState
													),
													workspace: row.workspaceName,
												})}
											</Text>
										</li>
									))}
								</ul>
							</section>
						</>
					)}
				</>
			) : null}
		</Grid>
	);
};