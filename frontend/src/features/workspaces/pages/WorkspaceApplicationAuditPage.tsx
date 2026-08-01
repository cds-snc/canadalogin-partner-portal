import { useMemo, useState, type FormEvent } from "react";
import { useParams } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import type { FunctionComponent } from "@/common/types";
import {
	Button,
	DataTable,
	DateInput,
	Heading,
	Notice,
	Text,
} from "@/components/ui";
import type { DataTableColumn } from "@/components/ui/DataTable";
import { getRequestErrorNotice } from "@/fetch";
import {
	useWorkspaceRPApplication,
	useWorkspaceRPApplicationAuditTrail,
} from "../hooks/use-workspace-rp-applications";

type AuditRow = {
	country: string;
	origin: string;
	result: string;
	timestamp: string;
	user: string;
	uuid: string;
};

const getToday = (): string => new Date().toISOString().slice(0, 10);

export const WorkspaceApplicationAuditPage = (): FunctionComponent => {
	const { t } = useTranslation() as unknown as {
		t: (
			key: string | Array<string>,
			options?: Record<string, unknown>
		) => string;
	};
	const { rpApplicationUuid, workspaceUuid } = useParams({
		from: "/workspaces/$workspaceUuid/applications/$rpApplicationUuid/audit",
	});
	const [draftSelectedDate, setDraftSelectedDate] = useState<string>(getToday);
	const [activeSelectedDate, setActiveSelectedDate] =
		useState<string>(getToday);
	const {
		application,
		error: applicationError,
		isLoading: isLoadingApplication,
	} = useWorkspaceRPApplication(workspaceUuid, rpApplicationUuid);
	const { error, events, isLoading, isLoadingMore, loadMore, next, total } =
		useWorkspaceRPApplicationAuditTrail(
			workspaceUuid,
			rpApplicationUuid,
			activeSelectedDate,
			25
		);
	const errorNotice = getRequestErrorNotice(error ?? applicationError, {
		bodyKey: "workspaces.applicationsErrorBody",
		titleKey: "workspaces.applicationsErrorTitle",
	});
	const rows: Array<AuditRow> = useMemo(
		() =>
			events.map((event, index) => ({
				country: event.country,
				origin: event.originDisplay || event.origin,
				result: event.result,
				timestamp: event.timeSeconds
					? new Date(event.timeSeconds * 1000).toISOString()
					: t("common.notAvailable"),
				user: event.usernameDisplay || event.username,
				uuid: `${event.timeSeconds ?? "none"}-${event.username}-${index}`,
			})),
		[events, t]
	);
	const columns: Array<DataTableColumn<AuditRow>> = [
		{
			field: "timestamp",
			headerName: t("workspaces.applicationsAuditTimestampColumn"),
		},
		{
			field: "result",
			headerName: t("workspaces.applicationsAuditResultColumn"),
		},
		{
			field: "user",
			headerName: t("workspaces.applicationsAuditUserColumn"),
		},
		{
			field: "origin",
			headerName: t("workspaces.applicationsAuditOriginColumn"),
		},
		{
			field: "country",
			headerName: t("workspaces.applicationsAuditCountryColumn"),
		},
	];

	const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
		event.preventDefault();
		setActiveSelectedDate(draftSelectedDate);
	};

	return (
		<>
			<Heading tag="h1">
				{application
					? t("workspaces.applicationsAuditPageTitle", {
							name: application.dnr_app_name,
						})
					: t("workspaces.applicationsAuditAction")}
			</Heading>
			<Text>{t("workspaces.applicationsAuditSummary")}</Text>

			<form
				className="grid gap-300 rounded-sm border border-[var(--gcds-border-default)] bg-[var(--gcds-bg-white)] p-300"
				onSubmit={handleSubmit}
			>
				<DateInput
					required
					format="full"
					legend={t("workspaces.applicationsAuditDateLabel")}
					name="workspace-application-audit-date"
					value={draftSelectedDate}
					onInput={(event): void => {
						setDraftSelectedDate((event.target as HTMLInputElement).value);
					}}
				/>
				<div>
					<Button className="w-full md:w-auto" type="submit">
						{t("workspaces.applicationsAuditApplyAction")}
					</Button>
				</div>
			</form>

			{isLoading || isLoadingApplication ? (
				<Notice
					noticeRole="info"
					noticeTitle={t("workspaces.applicationsAuditLoadingTitle")}
					noticeTitleTag="h2"
				>
					<Text>{t("workspaces.applicationsAuditLoadingBody")}</Text>
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

			{!isLoading &&
			!isLoadingApplication &&
			!errorNotice &&
			rows.length === 0 ? (
				<Notice
					noticeRole="warning"
					noticeTitle={t("workspaces.applicationsAuditEmptyTitle")}
					noticeTitleTag="h2"
				>
					<Text>{t("workspaces.applicationsAuditEmptyBody")}</Text>
				</Notice>
			) : null}

			{rows.length > 0 ? (
				<div className="grid gap-300">
					{typeof total === "number" ? (
						<Text>
							{t("workspaces.applicationsAuditShowing", {
								shown: rows.length,
								total,
							})}
						</Text>
					) : null}
					<DataTable
						columns={columns}
						getRowId={(row): string => row.uuid}
						itemLabel="workspace RP application audit events"
						pagination={false}
						rows={rows}
						title={t("workspaces.applicationsAuditAction")}
					/>

					{next ? (
						<div className="flex flex-wrap items-center gap-200">
							<Text>{t("workspaces.applicationsAuditMoreAvailable")}</Text>
							<Button
								type="button"
								onGcdsClick={() => {
									void loadMore();
								}}
							>
								{isLoadingMore
									? t("workspaces.loadingApplications")
									: t("workspaces.applicationsAuditLoadMore")}
							</Button>
						</div>
					) : null}
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
