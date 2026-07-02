import { useState, type ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { Button, Checkboxes, Heading, Text } from "@/components/ui";
import { CenteredPageLayout } from "@/components/layout";
import { useSession } from "@/hooks";
import { acceptTerms } from "@/fetch/user-terms";
import { useToast } from "@/components/ui/Toast";

const TermsAndConditionsPage = (): ReactElement => {
	const { t } = useTranslation() as unknown as {
		t: (
			key: string | Array<string>,
			options?: Record<string, unknown>
		) => string;
	};
	const navigate = useNavigate();
	const search = useSearch({ from: "/terms-and-conditions" });
	const { refreshSession, currentUser } = useSession();
	const hasAlreadyAccepted = currentUser?.acceptedTermsAt != null;
	const toast = useToast();

	const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
	const [acceptedTerms, setAcceptedTerms] = useState<Array<string>>([]);
	const [submitError, setSubmitError] = useState<string | null>(null);
	const isAccepted = acceptedTerms.includes("accepted");

	const handleAccept = async (): Promise<void> => {
		if (!isAccepted) return;

		setSubmitError(null);
		try {
			setIsSubmitting(true);
			await acceptTerms();
			toast.success(t("termsAndConditions.success"));
			await refreshSession();
			await navigate({
				replace: true,
				to: search.redirect ?? "/dashboard",
			});
		} catch (err) {
			console.error(err);
			setSubmitError(t("termsAndConditions.error"));
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<CenteredPageLayout className="max-w-3xl gap-400">
			<Heading tag="h1">{t("termsAndConditions.title")}</Heading>

			<Text>{t("termsAndConditions.intro")}</Text>

			<div>
				<Heading tag="h2">{t("termsAndConditions.section1Title")}</Heading>
				<Text>{t("termsAndConditions.section1Body")}</Text>
			</div>

			<div>
				<Heading tag="h2">{t("termsAndConditions.section2Title")}</Heading>
				<Text>{t("termsAndConditions.section2Body")}</Text>
			</div>

			<div>
				<Heading tag="h2">{t("termsAndConditions.section3Title")}</Heading>
				<Text>{t("termsAndConditions.section3Body")}</Text>
			</div>

			{submitError ? <p className="gcds-error-message">{submitError}</p> : null}

			{hasAlreadyAccepted ? (
				<Text>{t("termsAndConditions.alreadyAccepted")}</Text>
			) : (
				<div className="flex flex-col gap-200">
					<Checkboxes
						name="terms-accept-checkbox"
						value={acceptedTerms}
						options={[
							{
								id: "terms-accept-checkbox-option",
								label: t("termsAndConditions.checkboxLabel"),
								value: "accepted",
							},
						]}
						onInput={(event) => {
							setAcceptedTerms(event.target.value);
						}}
					/>

					<div>
						<Button
							buttonRole="primary"
							disabled={!isAccepted || isSubmitting}
							type="button"
							onGcdsClick={handleAccept}
						>
							{isSubmitting
								? t("termsAndConditions.accepting")
								: t("termsAndConditions.acceptButton")}
						</Button>
					</div>
				</div>
			)}
		</CenteredPageLayout>
	);
};

export default TermsAndConditionsPage;
