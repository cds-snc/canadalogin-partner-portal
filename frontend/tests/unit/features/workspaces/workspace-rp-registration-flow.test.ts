import { describe, expect, it } from "vitest";
import {
	getEarliestIncompleteRegistrationStep,
	getNextWorkspaceRPRegistrationStep,
	getPreviousWorkspaceRPRegistrationStep,
	getRecoverableWorkspaceRPRegistrationStep,
	getWorkspaceRPRegistrationStepPath,
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

	it("builds resource routes without putting answers in the URL", () => {
		const path = getWorkspaceRPRegistrationStepPath(
			"workspace uuid",
			"rp uuid",
			"client-and-access"
		);
		expect(path).toBe(
			"/workspaces/workspace%20uuid/applications/rp%20uuid/registration/client-and-access"
		);
		expect(path).not.toContain("serviceName");
		expect(isWorkspaceRPRegistrationStep("review")).toBe(true);
		expect(isWorkspaceRPRegistrationStep("confirmation")).toBe(false);
	});
});
