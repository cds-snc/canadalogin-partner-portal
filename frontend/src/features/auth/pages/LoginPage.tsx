import { getRouteApi } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import type { FunctionComponent } from "@/common/types";
import { Button, Heading, Notice, Text } from "@/components/ui";
import { CenteredPageLayout } from "@/components/layout";
import { useSession } from "@/hooks";

const loginRouteApi = getRouteApi("/login");

export const LoginPage = (): FunctionComponent => {
	const { t } = useTranslation();
	const { login } = useSession();
	const { loginNotice } = loginRouteApi.useLoaderData();

	return (
		<CenteredPageLayout className="max-w-5xl mx-0">
			<Heading tag="h1">{t("login.title")}</Heading>
			<Text>{t("login.summary")}</Text>
			{loginNotice ? (
				<Notice
					noticeRole="warning"
					noticeTitle={t(loginNotice.titleKey as never)}
					noticeTitleTag="h2"
				>
					<Text>{t(loginNotice.bodyKey as never)}</Text>
				</Notice>
			) : null}
			<div>
				<Button
					buttonId="login-action"
					buttonRole="primary"
					type="button"
					onGcdsClick={login}
				>
					{t("login.action")}
				</Button>
			</div>
		</CenteredPageLayout>
	);
};
