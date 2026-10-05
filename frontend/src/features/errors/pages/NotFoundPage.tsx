import { useTranslation } from "react-i18next";
import type { FunctionComponent } from "@/common/types";
import { Button, Heading, Link, Text } from "@/components/ui";
import { useSession } from "@/hooks";

export const NotFoundPage = (): FunctionComponent => {
	const { t } = useTranslation();
	const { hasHydrated, isAuthenticated } = useSession();
	const actionHref = isAuthenticated ? "/applications" : "/";
	const actionKey = isAuthenticated
		? "genericError.notFoundApplicationsAction"
		: "genericError.notFoundPartnerPortalAction";

	return (
		<>
			<Heading tag="h1">{t("genericError.notFoundTitle")}</Heading>
			<Text>{t("genericError.notFoundBody")}</Text>
			<Text>
				{t("genericError.notFoundSupportPrefix")} {" "}
				<Link href="/support">{t("genericError.notFoundSupportLink")}</Link>.
			</Text>
			{hasHydrated ? (
				<Button href={actionHref} type="link">
					{t(actionKey)}
				</Button>
			) : null}
		</>
	);
};