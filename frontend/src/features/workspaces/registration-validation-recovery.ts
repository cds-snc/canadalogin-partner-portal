import type { RegistrationDataStep } from "@/fetch/rp-applications";
import type { WorkspaceRPApplicationFieldErrorKeys } from "./workspace-rp-application-form";

type PendingRegistrationValidation = Partial<
	Record<RegistrationDataStep, WorkspaceRPApplicationFieldErrorKeys>
>;

const pendingValidationByDraft = new Map<
	string,
	PendingRegistrationValidation
>();

export const setPendingRegistrationValidation = (
	draftKey: string,
	validation: PendingRegistrationValidation
): void => {
	pendingValidationByDraft.set(draftKey, validation);
};

export const getPendingRegistrationValidation = (
	draftKey: string,
	step: RegistrationDataStep
): WorkspaceRPApplicationFieldErrorKeys => ({
	...(pendingValidationByDraft.get(draftKey)?.[step] ?? {}),
});

export const getPendingRegistrationValidationSteps = (
	draftKey: string
): Array<RegistrationDataStep> =>
	Object.keys(
		pendingValidationByDraft.get(draftKey) ?? {}
	) as Array<RegistrationDataStep>;

export const clearPendingRegistrationValidationStep = (
	draftKey: string,
	step: RegistrationDataStep
): void => {
	const current = pendingValidationByDraft.get(draftKey);
	if (!current) return;
	delete current[step];
	if (Object.keys(current).length === 0)
		pendingValidationByDraft.delete(draftKey);
};

export const clearPendingRegistrationValidation = (draftKey: string): void => {
	pendingValidationByDraft.delete(draftKey);
};
