import { useEffect, useMemo, useState, type ReactElement } from "react";
import { useNavigate, useParams, useSearch } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { CenteredPageLayout } from "@/components/layout";
import { Button, Heading, Notice, Select, Text } from "@/components/ui";
import { HttpRequestError } from "@/fetch/errors";
import {
	assignCurrentUserRPApplicationDepartment,
	getCurrentUserRPApplicationDepartment,
} from "@/fetch/rp-applications";
import { useDepartments } from "@/features/departments/hooks/use-departments";

export const DepartmentSetupPage = (): ReactElement => {
	const { t } = useTranslation() as unknown as {
		t: (
			key: string | Array<string>,
			options?: Record<string, unknown>
		) => string;
	};
	const { rpApplicationUuid } = useParams({
		from: "/your-applications/$rpApplicationUuid/department-setup",
	});
	const search = useSearch({
		from: "/your-applications/$rpApplicationUuid/department-setup",
	});
	const navigate = useNavigate();

	const [applicationName, setApplicationName] = useState<string | null>(null);
	const [isContextLoading, setIsContextLoading] = useState(true);

	useEffect(() => {
		let isMounted = true;
		const loadContext = async (): Promise<void> => {
			try {
				const preflight =
					await getCurrentUserRPApplicationDepartment(rpApplicationUuid);
				if (!isMounted) return;
				setApplicationName(preflight.dnrAppName);
				setIsContextLoading(false);
			} catch (error) {
				if (!isMounted) return;
				if (error instanceof HttpRequestError && error.status === 403) {
					globalThis.location.replace("/access-denied");
					return;
				}
				if (error instanceof HttpRequestError && error.status === 404) {
					globalThis.location.replace("/error?kind=not_found");
					return;
				}
				globalThis.location.replace("/error?kind=unexpected");
			}
		};
		void loadContext();
		return (): void => {
			isMounted = false;
		};
	}, [rpApplicationUuid]);

	const {
		departments = [],
		isLoading: isDepartmentsLoading,
		error: departmentsError,
	} = useDepartments(1, 200);

	const sortedDepartments = useMemo(
		() => [...departments].sort((a, b) => a.name.localeCompare(b.name)),
		[departments]
	);

	const [selected, setSelected] = useState<string>("");
	const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
	const [submitError, setSubmitError] = useState<string | null>(null);

	const handleSubmit = async (): Promise<void> => {
		if (!selected) return;

		setSubmitError(null);
		try {
			setIsSubmitting(true);
			await assignCurrentUserRPApplicationDepartment(rpApplicationUuid, {
				departmentUuid: selected,
			});
			const redirectTarget =
				search.redirect ?? `/your-applications/${rpApplicationUuid}`;
			await navigate({ to: redirectTarget, replace: true });
		} catch (error) {
			if (error instanceof HttpRequestError && error.status === 409) {
				// Already assigned — precondition satisfied, navigate to details
				await navigate({
					to: "/your-applications/$rpApplicationUuid",
					params: { rpApplicationUuid },
					replace: true,
				});
				return;
			}
			setSubmitError(t("rpDepartmentSetup.errorSaving"));
		} finally {
			setIsSubmitting(false);
		}
	};

	const isLoading = isContextLoading || isDepartmentsLoading;

	if (isLoading) {
		return (
			<CenteredPageLayout className="max-w-3xl gap-400">
				<Heading tag="h1">{t("rpDepartmentSetup.title")}</Heading>
				<Text>{t("rpDepartmentSetup.loading")}</Text>
			</CenteredPageLayout>
		);
	}

	if (departmentsError) {
		return (
			<CenteredPageLayout className="max-w-3xl gap-400">
				<Heading tag="h1">{t("rpDepartmentSetup.title")}</Heading>
				<Notice
					noticeRole="warning"
					noticeTitle={t("rpDepartmentSetup.errorLoading")}
					noticeTitleTag="h2"
				>
					<Text>{departmentsError.message ?? String(departmentsError)}</Text>
				</Notice>
			</CenteredPageLayout>
		);
	}

	if (departments.length === 0) {
		return (
			<CenteredPageLayout className="max-w-3xl gap-400">
				<Heading tag="h1">{t("rpDepartmentSetup.title")}</Heading>
				<Notice
					noticeRole="warning"
					noticeTitle={t("rpDepartmentSetup.noDepartments")}
					noticeTitleTag="h2"
				>
					<Text>{t("rpDepartmentSetup.noDepartments")}</Text>
				</Notice>
			</CenteredPageLayout>
		);
	}

	return (
		<>
			{applicationName ? (
				<Heading tag="h1">{applicationName}</Heading>
			) : (
				<Heading tag="h1">{t("rpDepartmentSetup.title")}</Heading>
			)}

			<Text>{t("rpDepartmentSetup.intro")}</Text>

			{submitError ? (
				<Notice
					noticeRole="danger"
					noticeTitle={t("rpDepartmentSetup.errorSaving")}
					noticeTitleTag="h2"
				>
					<Text>{submitError}</Text>
				</Notice>
			) : null}

			<div className="flex flex-col gap-200">
				<Select
					required
					label={t("rpDepartmentSetup.departmentLabel")}
					name="department"
					selectId="rp-department-select"
					value={selected}
					onInput={(e) => {
						setSelected((e.target as HTMLSelectElement).value);
					}}
				>
					<option value="">{t("rpDepartmentSetup.chooseDepartment")}</option>
					{sortedDepartments.map((d) => (
						<option key={d.uuid} value={d.uuid}>
							{d.name}
						</option>
					))}
				</Select>

				<div>
					<Button
						buttonRole="primary"
						disabled={!selected || isSubmitting}
						type="button"
						onGcdsClick={handleSubmit}
					>
						{isSubmitting
							? t("rpDepartmentSetup.loading")
							: t("rpDepartmentSetup.save")}
					</Button>
				</div>
			</div>
		</>
	);
};
