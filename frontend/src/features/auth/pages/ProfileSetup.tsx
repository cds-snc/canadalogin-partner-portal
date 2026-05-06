import { useState, type ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { Button, Heading, Notice, Select, Text } from "@/components/ui";
import { CenteredPageLayout } from "@/components/layout";
import { useDepartments, useSession } from "@/hooks";
import { setMyDepartment } from "@/fetch/user-departments";
import { useNavigate } from "@tanstack/react-router";
import { useToast } from "@/components/ui/Toast";

export const ProfileSetup = (): ReactElement => {
	const { t } = useTranslation() as unknown as {
		t: (
			key: string | Array<string>,
			options?: Record<string, unknown>
		) => string;
	};
	const { currentUser, refreshSession } = useSession();
	const navigate = useNavigate();
	const toast = useToast();

	const {
		departments = [],
		isLoading: isDepartmentsLoading,
		error: departmentsError,
	} = useDepartments(1, 200);
	const userUuid = currentUser?.uuid ?? null;
	const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
	const [submitError, setSubmitError] = useState<string | null>(null);

	const [selected, setSelected] = useState<string>("");

	const handleSubmit = async (): Promise<void> => {
		if (!selected || !userUuid) return;

		setSubmitError(null);
		try {
			setIsSubmitting(true);
			await setMyDepartment(selected);
			toast.success(t("profile.departmentSavedSuccess"));
			await refreshSession();
			await navigate({ replace: true, to: "/dashboard" });
		} catch (err) {
			console.error(err);
			setSubmitError(t("profile.errorSaving"));
		} finally {
			setIsSubmitting(false);
		}
	};

	if (isDepartmentsLoading) {
		return (
			<CenteredPageLayout className="max-w-3xl gap-400">
				<Heading tag="h1">{t("profile.setupTitle")}</Heading>
				<Text>{t("profile.loading")}</Text>
			</CenteredPageLayout>
		);
	}

	if (departmentsError) {
		return (
			<CenteredPageLayout className="max-w-3xl gap-400">
				<Heading tag="h1">{t("profile.setupTitle")}</Heading>
				<Notice
					noticeRole="warning"
					noticeTitle={t("profile.errorLoading")}
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
				<Heading tag="h1">{t("profile.setupTitle")}</Heading>
				<Text>{t("profile.setupIntro")}</Text>
				<Notice
					noticeRole="warning"
					noticeTitle={t("profile.noDepartments")}
					noticeTitleTag="h2"
				>
					<Text>
						If no departments are listed you may need to contact an
						administrator.
					</Text>
				</Notice>
			</CenteredPageLayout>
		);
	}

	return (
		<CenteredPageLayout className="max-w-3xl gap-400">
			<Heading tag="h1">{t("profile.setupTitle")}</Heading>

			<Text>{t("profile.setupIntro")}</Text>

			{submitError ? (
				<Notice
					noticeRole="danger"
					noticeTitle={t("profile.errorSaving")}
					noticeTitleTag="h2"
				>
					<Text>{submitError}</Text>
				</Notice>
			) : null}

			<Notice
				noticeRole="info"
				noticeTitle={t("profile.setupInstruction")}
				noticeTitleTag="h2"
			>
				<div className="flex flex-col gap-200">
					<label htmlFor="department-select">
						{t("profile.selectDepartment")}
					</label>
					<Select
						label={t("profile.selectDepartment")}
						name="department"
						selectId="department-select"
						value={selected}
						onInput={(e) => {
							setSelected((e.target as HTMLSelectElement).value);
						}}
					>
						<option value="">{t("profile.chooseDepartment")}</option>
						{departments.map((d) => (
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
							{isSubmitting ? t("profile.loading") : t("profile.save")}
						</Button>
					</div>
				</div>
			</Notice>
		</CenteredPageLayout>
	);
};

export default ProfileSetup;
