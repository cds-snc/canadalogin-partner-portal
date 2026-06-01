import { Link, useParams } from "@tanstack/react-router";
import { workspaceCopy } from "../workspace-copy";

export const WorkspaceDetailPage = (): JSX.Element => {
	const { workspaceUuid } = useParams({ from: "/workspaces/$workspaceUuid" });

	return (
		<div style={{ padding: 24 }}>
			<h1>{workspaceCopy.detailTitle}</h1>
			<p>{workspaceUuid}</p>
			<p>
				<Link params={{ workspaceUuid, rpApplicationUuid: "demo" }} to="/rp-applications/mine/$rpApplicationUuid">
					Open current-user RP application demo route
				</Link>
			</p>
		</div>
	);
};