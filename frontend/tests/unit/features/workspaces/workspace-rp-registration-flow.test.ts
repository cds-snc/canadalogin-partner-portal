import { describe, expect, it } from "vitest";
import {
	getEarliestIncompleteRegistrationStep,
	getNextWorkspaceRPRegistrationStep,
	getPreviousWorkspaceRPRegistrationStep,
	getRecoverableWorkspaceRPRegistrationStep,
	getWorkspaceRPRegistrationStepState,
	isWorkspaceRPRegistrationStep,
	WORKSPACE_RP_REGISTRATION_STEPS,
} from "@/features/workspaces/workspace-rp-registration-flow";

describe("workspace RP registration flow", () => {
	it("records the six ordered steps and confirmation outside the sequence", () => {
		expect(WORKSPACE_RP_REGISTRATION_STEPS).toEqual([
			"basics",
			"endpoints",
			"client-and-access",
			"signing",
			"encryption",
			"review",
		]);
		expect(getNextWorkspaceRPRegistrationStep("encryption")).toBe("review");
		expect(getPreviousWorkspaceRPRegistrationStep("basics")).toBeNull();
		expect(getPreviousWorkspaceRPRegistrationStep("review")).toBe("encryption");
	});

	it("derives contiguous resume progress and recovers direct future steps", () => {
		expect(getEarliestIncompleteRegistrationStep(null)).toBe("basics");
		expect(getEarliestIncompleteRegistrationStep("basics")).toBe("endpoints");
		expect(getEarliestIncompleteRegistrationStep("encryption")).toBe("review");
		expect(getRecoverableWorkspaceRPRegistrationStep("signing", "basics")).toBe(
			"endpoints"
		);
		expect(getRecoverableWorkspaceRPRegistrationStep("basics", "signing")).toBe(
			"basics"
		);
	});

	it("recognizes registration steps but keeps confirmation outside the sequence", () => {
		expect(isWorkspaceRPRegistrationStep("review")).toBe(true);
		expect(isWorkspaceRPRegistrationStep("confirmation")).toBe(false);
	});

	it("links only server-completed steps while keeping current and future steps non-links", () => {
		expect(
			getWorkspaceRPRegistrationStepState("basics", "endpoints", "basics")
		).toBe("available");
		expect(
			getWorkspaceRPRegistrationStepState("endpoints", "endpoints", "basics")
		).toBe("current");
		expect(
			getWorkspaceRPRegistrationStepState(
				"client-and-access",
				"endpoints",
				"basics"
			)
		).toBe("blocked");
		expect(
			getWorkspaceRPRegistrationStepState("review", "basics", "encryption")
		).toBe("blocked");
	});
});
