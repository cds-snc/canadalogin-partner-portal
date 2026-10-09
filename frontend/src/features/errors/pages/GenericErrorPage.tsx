import { useTranslation } from "react-i18next";
import type { FunctionComponent } from "@/common/types";
import { Button, Container, Heading, Link, Text } from "@/components/ui";
import { useSession } from "@/hooks";

export type GenericErrorKind = "not_found" | "unexpected";

type GenericErrorPageProps = {
	kind: GenericErrorKind;
};

export const GenericErrorPage = ({
	kind,
}: GenericErrorPageProps): FunctionComponent => {
	const { t } = useTranslation();
	const { hasHydrated, isAuthenticated } = useSession();
	const isNotFound = kind === "not_found";
	const titleKey = isNotFound
		? "genericError.notFoundTitle"
		: "genericError.unexpectedTitle";
	const bodyKey = isNotFound
		? "genericError.notFoundBody"
		: "genericError.unexpectedBody";
	const actionHref = isAuthenticated ? "/applications" : "/";
	const actionKey = isAuthenticated
		? "genericError.notFoundApplicationsAction"
		: "genericError.notFoundPartnerPortalAction";

	return (
		<Container alignment="start" id="generic-error-page-content" size="md">
			<Heading tag="h1">{t(titleKey)}</Heading>
			<Text>{t(bodyKey)}</Text>
			<Text>
				{t("genericError.notFoundSupportPrefix")} {" "}
				<Link href="/support">{t("genericError.notFoundSupportLink")}</Link>.
			</Text>
			{hasHydrated ? (
				<Button href={actionHref} type="link">
					{t(actionKey)}
				</Button>
			) : null}
		</Container>
	);
};
