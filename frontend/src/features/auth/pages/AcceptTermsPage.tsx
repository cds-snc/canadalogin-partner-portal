import { useState, type ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { Button, Checkboxes, Text } from "@/components/ui";
import { useSession } from "@/hooks";
import { acceptTerms } from "@/fetch/user-terms";
import { useToast } from "@/components/ui/Toast";
import TermsAndConditionsContent from "./TermsAndConditionsContent";

const AcceptTermsPage = (): ReactElement => {
	const { t } = useTranslation() as unknown as {
		t: (
			key: string | Array<string>,
			options?: Record<string, unknown>
		) => string;
	};
	const navigate = useNavigate();
	const search = useSearch({ from: "/accept-terms" });
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
				to: search.redirect ?? "/your-applications",
			});
		} catch (err) {
			console.error(err);
			setSubmitError(t("termsAndConditions.error"));
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<>
			<TermsAndConditionsContent />

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
		</>
	);
};

export default AcceptTermsPage;
