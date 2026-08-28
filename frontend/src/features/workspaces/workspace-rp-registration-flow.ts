import type { RegistrationDataStep } from "@/fetch/rp-applications";

export const WORKSPACE_RP_REGISTRATION_STEPS = [
	"basics",
	"endpoints",
	"client-and-access",
	"signing",
	"encryption",
	"review",
] as const;

export type WorkspaceRPRegistrationStep =
	(typeof WORKSPACE_RP_REGISTRATION_STEPS)[number];

export const WORKSPACE_RP_REGISTRATION_STEP_LABEL_KEYS = {
	basics: "workspaces.registration.steps.basics",
	"client-and-access": "workspaces.registration.steps.clientAndAccess",
	encryption: "workspaces.registration.steps.encryption",
	endpoints: "workspaces.registration.steps.endpoints",
	review: "workspaces.registration.steps.review",
	signing: "workspaces.registration.steps.signing",
} as const satisfies Record<WorkspaceRPRegistrationStep, string>;

export const isWorkspaceRPRegistrationStep = (
	value: string
): value is WorkspaceRPRegistrationStep =>
	WORKSPACE_RP_REGISTRATION_STEPS.includes(
		value as WorkspaceRPRegistrationStep
	);

export const isRegistrationDataStep = (
	step: WorkspaceRPRegistrationStep
): step is RegistrationDataStep => step !== "review";

export const getPreviousWorkspaceRPRegistrationStep = (
	step: WorkspaceRPRegistrationStep
): WorkspaceRPRegistrationStep | null => {
	const index = WORKSPACE_RP_REGISTRATION_STEPS.indexOf(step);
	return index > 0
		? (WORKSPACE_RP_REGISTRATION_STEPS[index - 1] ?? null)
		: null;
};

export const getNextWorkspaceRPRegistrationStep = (
	step: RegistrationDataStep
): WorkspaceRPRegistrationStep => {
	const index = WORKSPACE_RP_REGISTRATION_STEPS.indexOf(step);
	return WORKSPACE_RP_REGISTRATION_STEPS[index + 1] ?? "review";
};

export const getEarliestIncompleteRegistrationStep = (
	lastCompletedStep: RegistrationDataStep | null
): WorkspaceRPRegistrationStep => {
	if (!lastCompletedStep) {
		return "basics";
	}
	return getNextWorkspaceRPRegistrationStep(lastCompletedStep);
};

export const getRecoverableWorkspaceRPRegistrationStep = (
	requestedStep: WorkspaceRPRegistrationStep,
	lastCompletedStep: RegistrationDataStep | null
): WorkspaceRPRegistrationStep => {
	const earliestIncomplete =
		getEarliestIncompleteRegistrationStep(lastCompletedStep);
	return WORKSPACE_RP_REGISTRATION_STEPS.indexOf(requestedStep) >
		WORKSPACE_RP_REGISTRATION_STEPS.indexOf(earliestIncomplete)
		? earliestIncomplete
		: requestedStep;
};

export type WorkspaceRPRegistrationStepState =
	"available" | "blocked" | "current";

export const getWorkspaceRPRegistrationStepState = (
	targetStep: WorkspaceRPRegistrationStep,
	currentStep: WorkspaceRPRegistrationStep,
	lastCompletedStep: RegistrationDataStep | null
): WorkspaceRPRegistrationStepState => {
	if (targetStep === currentStep) return "current";
	const completedIndex = lastCompletedStep
		? WORKSPACE_RP_REGISTRATION_STEPS.indexOf(lastCompletedStep)
		: -1;
	return WORKSPACE_RP_REGISTRATION_STEPS.indexOf(targetStep) <= completedIndex
		? "available"
		: "blocked";
};
