import { useState, type FormEvent } from "react";
import { useParams } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import type { FunctionComponent } from "@/common/types";
import { Button, DateInput, Heading, Notice, Text } from "@/components/ui";
import { getRequestErrorNotice } from "@/fetch";
import {
	useWorkspaceRPApplication,
	useWorkspaceRPApplicationUsageSummary,
} from "../hooks/use-workspace-rp-applications";

const getToday = (): string => new Date().toISOString().slice(0, 10);

export const WorkspaceApplicationUsagePage = (): FunctionComponent => {
	const { t } = useTranslation() as unknown as {
		t: (
			key: string | Array<string>,
			options?: Record<string, unknown>
		) => string;
	};
	const { rpApplicationUuid, workspaceUuid } = useParams({
		from: "/workspaces/$workspaceUuid/applications/$rpApplicationUuid/usage",
	});
	const [draftSelectedDate, setDraftSelectedDate] = useState<string>(getToday);
	const [activeSelectedDate, setActiveSelectedDate] =
		useState<string>(getToday);
	const {
		application,
		error: applicationError,
		isLoading: isLoadingApplication,
	} = useWorkspaceRPApplication(workspaceUuid, rpApplicationUuid);
	const { error, isLoading, summary } = useWorkspaceRPApplicationUsageSummary(
		workspaceUuid,
		rpApplicationUuid,
		activeSelectedDate
	);
	const errorNotice = getRequestErrorNotice(error ?? applicationError, {
		bodyKey: "workspaces.applicationsErrorBody",
		titleKey: "workspaces.applicationsErrorTitle",
	});

	const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
		event.preventDefault();
		setActiveSelectedDate(draftSelectedDate);
	};

	return (
		<>
			<Heading tag="h1">
				{application
					? t("workspaces.applicationsUsagePageTitle", {
							name: application.dnr_app_name,
						})
					: t("workspaces.applicationsUsageAction")}
			</Heading>
			<Text>{t("workspaces.applicationsUsageSummary")}</Text>

			<form
				className="grid gap-300 rounded-sm border border-[var(--gcds-border-default)] bg-[var(--gcds-bg-white)] p-300"
				onSubmit={handleSubmit}
			>
				<DateInput
					required
					format="full"
					legend={t("workspaces.applicationsUsageDateLabel")}
					name="workspace-application-usage-date"
					value={draftSelectedDate}
					onInput={(event): void => {
						setDraftSelectedDate((event.target as HTMLInputElement).value);
					}}
				/>
				<div>
					<Button className="w-full md:w-auto" type="submit">
						{t("workspaces.applicationsUsageApplyAction")}
					</Button>
				</div>
			</form>

			{isLoading || isLoadingApplication ? (
				<Notice
					noticeRole="info"
					noticeTitle={t("workspaces.applicationsUsageLoadingTitle")}
					noticeTitleTag="h2"
				>
					<Text>{t("workspaces.applicationsUsageLoadingBody")}</Text>
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

			{summary && !isLoading && !isLoadingApplication && !errorNotice ? (
				<div className="grid gap-300 md:grid-cols-3">
					<div className="rounded-sm border border-[var(--gcds-border-default)] bg-[var(--gcds-bg-white)] p-300">
						<h2 className="gcds-heading gcds-heading--h3">
							{t("workspaces.applicationsUsageTotalLabel")}
						</h2>
						<Text>{String(summary.total)}</Text>
					</div>
					<div className="rounded-sm border border-[var(--gcds-border-default)] bg-[var(--gcds-bg-white)] p-300">
						<h2 className="gcds-heading gcds-heading--h3">
							{t("workspaces.applicationsUsageSucceededLabel")}
						</h2>
						<Text>{String(summary.succeeded)}</Text>
					</div>
					<div className="rounded-sm border border-[var(--gcds-border-default)] bg-[var(--gcds-bg-white)] p-300">
						<h2 className="gcds-heading gcds-heading--h3">
							{t("workspaces.applicationsUsageFailedLabel")}
						</h2>
						<Text>{String(summary.failed)}</Text>
					</div>
				</div>
			) : null}

			<div className="mt-200">
				<Button
					href={`/workspaces/${workspaceUuid}/applications/${rpApplicationUuid}`}
					type="link"
				>
					{t("workspaces.applicationsBackToDetail")}
				</Button>
			</div>
		</>
	);
};
