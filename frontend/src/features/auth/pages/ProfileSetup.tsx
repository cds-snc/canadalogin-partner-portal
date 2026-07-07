import { useMemo, useState, type ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { Button, Grid, Heading, Notice, Select, Text } from "@/components/ui";
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

	const sortedDepartments = useMemo(
		() => [...departments].sort((a, b) => a.name.localeCompare(b.name)),
		[departments]
	);

	const [selected, setSelected] = useState<string>("");

	const handleSubmit = async (): Promise<void> => {
		if (!selected || !userUuid) return;

		setSubmitError(null);
		try {
			setIsSubmitting(true);
			await setMyDepartment(selected);
			toast.success(t("profile.departmentSavedSuccess"));
			await refreshSession();
			await navigate({ replace: true, to: "/your-applications" });
		} catch (err) {
			console.error(err);
			setSubmitError(t("profile.errorSaving"));
		} finally {
			setIsSubmitting(false);
		}
	};

	if (isDepartmentsLoading) {
		return (
			<>
				<Heading tag="h1">{t("profile.setupTitle")}</Heading>
				<Text>{t("profile.loading")}</Text>
			</>
		);
	}

	if (departmentsError) {
		return (
			<>
				<Heading tag="h1">{t("profile.setupTitle")}</Heading>
				<Notice
					noticeRole="warning"
					noticeTitle={t("profile.errorLoading")}
					noticeTitleTag="h2"
				>
					<Text>{departmentsError.message ?? String(departmentsError)}</Text>
				</Notice>
			</>
		);
	}

	if (departments.length === 0) {
		return (
			<>
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
			</>
		);
	}

	return (
		<Grid columns="1fr" tag="div">
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

			<Select
				required
				hint={t("profile.departmentHint")}
				label={t("profile.departmentLabel")}
				name="department"
				selectId="department-select"
				value={selected}
				onInput={(e) => {
					setSelected((e.target as HTMLSelectElement).value);
				}}
			>
				<option value="">{t("profile.chooseDepartment")}</option>
				{sortedDepartments.map((d) => (
					<option key={d.uuid} value={d.uuid}>
						{d.name}
					</option>
				))}
			</Select>
			<Button
				buttonRole="primary"
				disabled={!selected || isSubmitting}
				type="button"
				onGcdsClick={handleSubmit}
			>
				{isSubmitting ? t("profile.loading") : t("profile.save")}
			</Button>
		</Grid>
	);
};

export default ProfileSetup;
