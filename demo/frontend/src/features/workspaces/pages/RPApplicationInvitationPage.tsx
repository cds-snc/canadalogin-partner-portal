import { useEffect, useState } from "react";
import { getRouteApi, Link, useNavigate } from "@tanstack/react-router";
import { acceptRPApplicationDeveloperInvitation, getCurrentUserRPApplications } from "@/fetch/workspaces";
import { workspaceCopy } from "../workspace-copy";

const invitationRouteApi = getRouteApi("/invitations/rp-applications");

export const RPApplicationInvitationPage = (): JSX.Element => {
	const navigate = useNavigate();
	const { token } = invitationRouteApi.useSearch();
	const [message, setMessage] = useState<string>("Loading invitation...");

	useEffect(() => {
		if (typeof token !== "string" || token.length === 0) {
			setMessage("Missing invitation token.");
			return;
		}

		void (async () => {
			const accepted = await acceptRPApplicationDeveloperInvitation(token);
			const applications = await getCurrentUserRPApplications();
			const matched = applications.find((application) => application.id === accepted.rp_application_id);
			if (matched) {
				await navigate({ params: { rpApplicationUuid: matched.uuid }, to: "/rp-applications/mine/$rpApplicationUuid" });
				return;
			}
			setMessage("Invitation accepted.");
		})();
	}, [navigate, token]);

	return (
		<div style={{ padding: 24 }}>
			<h1>{workspaceCopy.invitationTitle}</h1>
			<p>{message}</p>
			<p>
				<Link to="/dashboard">Back to dashboard</Link>
			</p>
		</div>
	);
};