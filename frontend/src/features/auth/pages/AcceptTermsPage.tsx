import { useState, type ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { Button, Text } from "@/components/ui";
import { useSession } from "@/hooks";
import { acceptTerms } from "@/fetch/user-terms";
import TermsAndConditionsContent from "./TermsAndConditionsContent";
import "./TermsAndConditions.css";

const AcceptTermsPage = (): ReactElement => {
	const { t } = useTranslation() as unknown as {
		t: (
			key: string | Array<string>,
			options?: Record<string, unknown>
		) => string;
	};
	const navigate = useNavigate();
	const search = useSearch({ from: "/accept-terms" });
	const { refreshSession } = useSession();

	const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
	const [submitError, setSubmitError] = useState<string | null>(null);

	const handleAccept = async (): Promise<void> => {
		setSubmitError(null);
		try {
			setIsSubmitting(true);
			await acceptTerms();
			await refreshSession();
			await navigate({
				replace: true,
				to: search.redirect ?? "/applications",
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

			{submitError ? <Text ariaLive="assertive">{submitError}</Text> : null}

			<div className="terms-and-conditions__actions">
				<Button
					buttonRole="primary"
					disabled={isSubmitting}
					type="button"
					onGcdsClick={handleAccept}
				>
					{isSubmitting
						? t("termsAndConditions.accepting")
						: t("termsAndConditions.acceptButton")}
				</Button>
				<Button buttonRole="secondary" href="/logout" type="link">
					{t("termsAndConditions.signOutButton")}
				</Button>
			</div>
		</>
	);
};

export default AcceptTermsPage;
