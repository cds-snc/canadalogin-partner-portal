import type {
	WorkspaceCreate,
	WorkspaceRead,
	WorkspaceUpdate,
} from "@/fetch/workspaces";

export type WorkspaceFormState = {
	description: string;
	name: string;
	slug: string;
};

export const createEmptyWorkspaceForm = (): WorkspaceFormState => ({
	description: "",
	name: "",
	slug: "",
});

const toOptionalString = (value: string): string | null => {
	const normalizedValue = value.trim();

	return normalizedValue.length > 0 ? normalizedValue : null;
};

export const toWorkspaceFormState = (
	workspace: WorkspaceRead
): WorkspaceFormState => ({
	description: workspace.description ?? "",
	name: workspace.name,
	slug: workspace.slug,
});

export const toWorkspaceCreatePayload = (
	form: WorkspaceFormState,
	departmentUuid: string
): WorkspaceCreate => ({
	departmentUuid,
	description: toOptionalString(form.description),
	name: form.name.trim(),
	slug: toOptionalString(form.slug),
});

export const toWorkspaceUpdatePayload = (
	form: WorkspaceFormState
): WorkspaceUpdate => ({
	description: toOptionalString(form.description),
	name: form.name.trim(),
	slug: toOptionalString(form.slug),
});