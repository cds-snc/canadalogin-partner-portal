import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { FunctionComponent } from "@/common/types";
import { Button, Notice, Text } from "@/components/ui";

interface InvitationLinkNoticeProps {
	acceptanceUrl: string;
	title: string;
}

type CopyResult = {
	acceptanceUrl: string;
	status: "copied" | "error";
};

export const InvitationLinkNotice = ({
	acceptanceUrl,
	title,
}: InvitationLinkNoticeProps): FunctionComponent => {
	const { t } = useTranslation();
	const [copyResult, setCopyResult] = useState<CopyResult | null>(null);
	const currentCopyStatus =
		copyResult?.acceptanceUrl === acceptanceUrl ? copyResult.status : null;

	const copyInvitationLink = async (): Promise<void> => {
		if (!globalThis.navigator?.clipboard?.writeText) {
			setCopyResult({ acceptanceUrl, status: "error" });
			return;
		}

		try {
			await globalThis.navigator.clipboard.writeText(acceptanceUrl);
			setCopyResult({ acceptanceUrl, status: "copied" });
		} catch {
			setCopyResult({ acceptanceUrl, status: "error" });
		}
	};

	return (
		<Notice noticeRole="success" noticeTitle={title} noticeTitleTag="h2">
			<Text>{t("invitations.manualDelivery.deliveryBody")}</Text>
			<Text>{t("invitations.manualDelivery.singleViewBody")}</Text>
			<Text>
				<strong>{t("invitations.manualDelivery.linkLabel")}:</strong>{" "}
				<span className="break-all">{acceptanceUrl}</span>
			</Text>
			<Button
				buttonRole="secondary"
				type="button"
				onGcdsClick={() => {
					void copyInvitationLink();
				}}
			>
				{t("invitations.manualDelivery.copyAction")}
			</Button>
			{currentCopyStatus ? (
				<Text ariaLive="polite" marginTop="200">
					{t(
						currentCopyStatus === "copied"
							? "invitations.manualDelivery.copiedConfirmation"
							: "invitations.manualDelivery.copyError"
					)}
				</Text>
			) : null}
		</Notice>
	);
};
