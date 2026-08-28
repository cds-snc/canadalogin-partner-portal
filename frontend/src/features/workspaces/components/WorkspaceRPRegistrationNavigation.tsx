import { useTranslation } from "react-i18next";
import type { FunctionComponent } from "@/common/types";
import { Heading, Link, Stepper } from "@/components/ui";
import type { RegistrationDataStep } from "@/fetch/rp-applications";
import {
	getWorkspaceRPRegistrationStepState,
	WORKSPACE_RP_REGISTRATION_STEPS,
	WORKSPACE_RP_REGISTRATION_STEP_LABEL_KEYS,
	type WorkspaceRPRegistrationStep,
} from "../workspace-rp-registration-flow";

type WorkspaceRPRegistrationNavigationProps = {
	currentStep: WorkspaceRPRegistrationStep;
	lastCompletedStep: RegistrationDataStep | null;
	onNavigate: (step: WorkspaceRPRegistrationStep) => void;
	pendingSteps?: Array<RegistrationDataStep>;
	stepPath: (step: WorkspaceRPRegistrationStep) => string;
};

export const WorkspaceRPRegistrationNavigation = ({
	currentStep,
	lastCompletedStep,
	onNavigate,
	pendingSteps = [],
	stepPath,
}: WorkspaceRPRegistrationNavigationProps): FunctionComponent => {
	const { t } = useTranslation();
	const currentIndex = WORKSPACE_RP_REGISTRATION_STEPS.indexOf(currentStep) + 1;

	return (
		<div className="grid gap-300">
			<Stepper
				currentStep={currentIndex}
				tabIndex={-1}
				tag="h2"
				totalSteps={WORKSPACE_RP_REGISTRATION_STEPS.length}
			>
				{t(WORKSPACE_RP_REGISTRATION_STEP_LABEL_KEYS[currentStep])}
			</Stepper>
			<nav
				aria-labelledby="registration-steps-heading"
				className="grid gap-200"
			>
				<Heading id="registration-steps-heading" marginBottom="0" tag="h2">
					{t("workspaces.registration.stepsNavigationTitle")}
				</Heading>
				<ol className="grid gap-100 list-decimal ps-500">
					{WORKSPACE_RP_REGISTRATION_STEPS.map((targetStep) => {
						const hasPendingError =
							targetStep !== "review" && pendingSteps.includes(targetStep);
						const derivedState = getWorkspaceRPRegistrationStepState(
							targetStep,
							currentStep,
							lastCompletedStep
						);
						const state =
							hasPendingError && targetStep !== currentStep
								? "blocked"
								: derivedState;
						const label = t(
							WORKSPACE_RP_REGISTRATION_STEP_LABEL_KEYS[targetStep]
						);
						return (
							<li key={targetStep}>
								{state === "available" ? (
									<Link
										href={stepPath(targetStep)}
										onGcdsClick={(event) => {
											event.preventDefault();
											onNavigate(targetStep);
										}}
									>
										{label}
									</Link>
								) : (
									<span aria-current={state === "current" ? "step" : undefined}>
										{label}{" "}
										<span className="font-text-small text-secondary">
											—{" "}
											{t(
												state === "current"
													? "workspaces.registration.currentStepStatus"
													: hasPendingError
														? "workspaces.registration.needsAttentionStatus"
														: "workspaces.registration.unavailableStepStatus"
											)}
										</span>
									</span>
								)}
							</li>
						);
					})}
				</ol>
			</nav>
		</div>
	);
};
