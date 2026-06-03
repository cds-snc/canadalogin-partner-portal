import { useEffect, useState } from "react";
import { useParams } from "@tanstack/react-router";
import { getCurrentUserRPApplication } from "@/fetch/workspaces";
import { workspaceCopy } from "../workspace-copy";

export const CurrentUserRPApplicationDetailPage = (): JSX.Element => {
	const { rpApplicationUuid } = useParams({ from: "/rp-applications/mine/$rpApplicationUuid" });
	const [label, setLabel] = useState<string>("Loading application...");

	useEffect(() => {
		void (async () => {
			const application = await getCurrentUserRPApplication(rpApplicationUuid);
			setLabel(`${application.name} in ${application.workspaceName}`);
		})();
	}, [rpApplicationUuid]);

	return (
		<div style={{ padding: 24 }}>
			<h1>{workspaceCopy.currentUserApplicationTitle}</h1>
			<p>{label}</p>
		</div>
	);
};