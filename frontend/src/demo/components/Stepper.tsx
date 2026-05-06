import React from "react";
import { Stepper as SharedStepper } from "@/components";

interface StepperProps {
	children: React.ReactNode;
	tag: "h1" | "h2" | "h3";
	currentStep: number;
	totalSteps: number;
	className?: string;
	tabIndex: number;
}

const Stepper: React.FC<StepperProps> = React.memo(
	({ children, tag, currentStep, totalSteps, className, tabIndex }) => (
		<SharedStepper
			tag={tag}
			currentStep={currentStep}
			totalSteps={totalSteps}
			className={className}
			tabIndex={tabIndex}
		>
			{children}
		</SharedStepper>
	)
);

export default Stepper;
