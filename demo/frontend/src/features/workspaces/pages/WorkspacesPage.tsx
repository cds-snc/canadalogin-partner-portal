import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { createWorkspace, getWorkspaces, type WorkspaceRead } from "@/fetch/workspaces";
import { workspaceCopy } from "../workspace-copy";

type WorkspaceFormState = {
	description: string;
	name: string;
	slug: string;
};

const emptyForm = (): WorkspaceFormState => ({ description: "", name: "", slug: "" });

export const WorkspacesPage = (): JSX.Element => {
	const [workspaces, setWorkspaces] = useState<Array<WorkspaceRead>>([]);
	const [form, setForm] = useState<WorkspaceFormState>(emptyForm());
	const [error, setError] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		void (async () => {
			try {
				setWorkspaces(await getWorkspaces());
			} catch (loadError) {
				setError(loadError instanceof Error ? loadError.message : "Failed to load workspaces");
			} finally {
				setIsLoading(false);
			}
		})();
	}, []);

	const handleCreate = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
		event.preventDefault();
		const created = await createWorkspace({
			description: form.description.trim() || undefined,
			name: form.name.trim(),
			slug: form.slug.trim() || undefined,
		});
		setWorkspaces((current) => [created, ...current]);
		setForm(emptyForm());
	};

	return (
		<div style={{ padding: 24 }}>
			<h1>{workspaceCopy.workspaceListTitle}</h1>
			{isLoading ? <p>{workspaceCopy.loadingWorkspaces}</p> : null}
			{error ? <p role="alert">{error}</p> : null}
			<form onSubmit={handleCreate}>
				<input aria-label="Workspace name" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder="Workspace name" />
				<input aria-label="Workspace slug" value={form.slug} onChange={(event) => setForm((current) => ({ ...current, slug: event.target.value }))} placeholder="workspace-slug" />
				<input aria-label="Workspace description" value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} placeholder="Optional description" />
				<button type="submit">Create workspace</button>
			</form>
			<ul>
				{workspaces.map((workspace) => (
					<li key={workspace.uuid}>
						<Link params={{ workspaceUuid: workspace.uuid }} to="/workspaces/$workspaceUuid">
							{workspace.name}
						</Link>
					</li>
				))}
			</ul>
		</div>
	);
};