import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { getLocalizedDepartmentName } from "@/common/get-localized-department-name";
import type { FunctionComponent } from "@/common/types";
import { Breadcrumbs, CenteredPageLayout } from "@/components/layout";
import { Heading, Notice, Text } from "@/components/ui";
import { ApplicationContactForm } from "@/features/workspaces/components/ApplicationContactForm";
import { getDepartmentById } from "@/fetch/departments";
import {
	getWorkspaceApplicationContacts,
	getWorkspaceApplicationInfos,
} from "@/fetch/application-info";
import { getWorkspaces } from "@/fetch/workspaces";

type ApplicationContactPageProps = {
	applicationContactUuid?: string;
	applicationInfoUuid: string;
	mode: "create" | "edit";
	workspaceUuid: string;
};

const detailCardClasses =
	"rounded-sm border border-[var(--gcds-border-default)] bg-[var(--gcds-bg-white)] px-400 py-350 shadow-[0_14px_28px_rgba(38,55,74,0.06)]";
const detailGridClasses =
	"grid gap-150 md:grid-cols-[minmax(0,220px)_minmax(0,1fr)] md:items-start";

export const ApplicationContactPage = ({
	applicationContactUuid,
	applicationInfoUuid,
	mode,
	workspaceUuid,
}: ApplicationContactPageProps): FunctionComponent => {
	const { t, i18n } = useTranslation() as unknown as {
		t: (key: string, options?: Record<string, unknown>) => string;
		i18n: {
			language: string;
		};
	};
	const navigate = useNavigate();

	const { data: workspace, isLoading: isWorkspaceLoading } = useQuery({
		queryKey: ["workspace", workspaceUuid],
		queryFn: () =>
			getWorkspaces().then((workspaces) =>
				workspaces.find((workspaceItem) => workspaceItem.uuid === workspaceUuid)
			),
		enabled: !!workspaceUuid,
	});

	const { data: applicationInfos, isLoading: isApplicationInfoLoading } = useQuery({
		queryKey: ["workspace-application-info", workspaceUuid],
		queryFn: () => getWorkspaceApplicationInfos(workspaceUuid),
		enabled: !!workspaceUuid,
	});

	const { data: contacts, isLoading: isContactsLoading } = useQuery({
		queryKey: ["application-info-contacts", workspaceUuid, applicationInfoUuid],
		queryFn: () =>
			getWorkspaceApplicationContacts(workspaceUuid, applicationInfoUuid),
		enabled: !!workspaceUuid && !!applicationInfoUuid,
	});

	const { data: department } = useQuery({
		queryKey: ["department", workspace?.departmentId],
		queryFn: () => getDepartmentById(workspace!.departmentId),
		enabled: typeof workspace?.departmentId === "number",
	});

	const applicationInfo =
		applicationInfos?.find((item) => item.uuid === applicationInfoUuid) ?? null;
	const applicationContact =
		mode === "edit"
			? contacts?.find((item) => item.uuid === applicationContactUuid) ?? null
			: null;
	const departmentName = getLocalizedDepartmentName(department, i18n.language);

	const navigateBack = (): void => {
		void navigate({
			params: { applicationInfoUuid, workspaceUuid },
			to: "/workspaces/$workspaceUuid/application-info/$applicationInfoUuid/contacts",
		});
	};

	if (isWorkspaceLoading || isApplicationInfoLoading || isContactsLoading) {
		return (
			<CenteredPageLayout className="max-w-4xl">
				<Text>{t("workspaces.loadingApplicationInfo")}</Text>
			</CenteredPageLayout>
		);
	}

	if (!workspace || !applicationInfo || (mode === "edit" && !applicationContact)) {
		return (
			<CenteredPageLayout className="max-w-4xl">
				<Notice
					noticeRole="danger"
					noticeTitle={t("workspaces.errorLoadingApplicationInfo")}
					noticeTitleTag="h2"
				>
					<Text>{t("workspaces.errorLoadingApplicationInfo")}</Text>
				</Notice>
			</CenteredPageLayout>
		);
	}

	return (
		<CenteredPageLayout className="max-w-4xl gap-400">
			<Breadcrumbs
				items={[
					{ href: "/", label: t("nav.home") },
					{ href: "/workspaces", label: t("workspaces.title") },
					{ href: `/workspaces/${workspaceUuid}`, label: workspace.name },
					{
						href: `/workspaces/${workspaceUuid}/application-info/${applicationInfoUuid}`,
						label: applicationInfo.applicationName,
					},
					{
						href:
							mode === "edit" && applicationContactUuid
								? `/workspaces/${workspaceUuid}/application-info/${applicationInfoUuid}/contacts/${applicationContactUuid}`
								: `/workspaces/${workspaceUuid}/application-info/${applicationInfoUuid}/contacts/new`,
						label: t(
							mode === "edit"
								? "workspaces.appInfoEditContactModalTitle"
								: "workspaces.appInfoContactModalTitle"
						),
					},
				]}
			/>
			<div className="flex flex-col gap-300">
				<div>
					<Heading tag="h1">
						{t(
							mode === "edit"
								? "workspaces.appInfoEditContactModalTitle"
								: "workspaces.appInfoContactModalTitle"
						)}
					</Heading>
				</div>
				<section className={detailCardClasses}>
					<div className={detailGridClasses}>
						<Text>{t("workspaces.workspaceName")}</Text>
						<Text>{workspace.name}</Text>
						<Text>{t("workspaces.appInfoApplicationNameLabel")}</Text>
						<Text>{applicationInfo.applicationName}</Text>
						<Text>{t("workspaces.department")}</Text>
						<Text>{departmentName}</Text>
					</div>
				</section>
				<section className={detailCardClasses}>
					<ApplicationContactForm
						applicationContact={applicationContact}
						applicationInfoUuid={applicationInfoUuid}
						mode={mode}
						workspaceUuid={workspaceUuid}
						onCancel={navigateBack}
						onSaved={navigateBack}
					/>
				</section>
			</div>
		</CenteredPageLayout>
	);
};