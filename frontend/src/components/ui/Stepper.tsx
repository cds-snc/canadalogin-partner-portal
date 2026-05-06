import React from "react";
import { GcdsStepper } from "@gcds-core/components-react";

interface StepperProps {
	children: React.ReactNode;
	className?: string;
	currentStep: number;
	tabIndex: number;
	tag: "h1" | "h2" | "h3";
	totalSteps: number;
}

const Stepper: React.FC<StepperProps> = React.memo(
	({ children, className, currentStep, tabIndex, tag, totalSteps }) => (
		<GcdsStepper
			className={className}
			currentStep={currentStep}
			tabIndex={tabIndex}
			tag={tag}
			totalSteps={totalSteps}
		>
			{children}
		</GcdsStepper>
	)
);

export default Stepper;
