import { useTranslation } from "react-i18next";
import type { FunctionComponent } from "@/common/types";
import { Button, Heading, Notice, Text } from "@/components/ui";

export type GenericErrorKind = "not_found" | "unexpected";

type GenericErrorPageProps = {
	kind: GenericErrorKind;
};

export const GenericErrorPage = ({
	kind,
}: GenericErrorPageProps): FunctionComponent => {
	const { t } = useTranslation();
	const isNotFound = kind === "not_found";
	const titleKey = isNotFound
		? "genericError.notFoundTitle"
		: "genericError.unexpectedTitle";
	const bodyKey = isNotFound
		? "genericError.notFoundBody"
		: "genericError.unexpectedBody";

	return (
		<>
			<Heading tag="h1">{t("genericError.title")}</Heading>
			<Notice noticeRole="danger" noticeTitle={t(titleKey)} noticeTitleTag="h2">
				<Text>{t(bodyKey)}</Text>
			</Notice>
			<div className="flex flex-wrap gap-150">
				<Button href="/your-applications" type="link">
					{t("genericError.dashboardAction")}
				</Button>
				<Button buttonRole="secondary" href="/" type="link">
					{t("genericError.homeAction")}
				</Button>
			</div>
		</>
	);
};
