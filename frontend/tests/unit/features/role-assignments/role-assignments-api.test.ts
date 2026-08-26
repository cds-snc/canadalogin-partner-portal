import { afterEach, describe, expect, it, vi } from "vitest";
import {
	assignClAdminRole,
	assignWorkspaceRole,
	getClAdminAssignmentEligibility,
	getClAdminRoleAssignments,
	getWorkspaceRoleAssignment,
	getWorkspaceRoleAssignments,
	replaceWorkspaceRoleAssignment,
	replaceWorkspaceRole,
	revokeClAdminRole,
	revokeWorkspaceRoleAssignment,
	revokeWorkspaceRole,
	searchWorkspaceRoleAssignmentCandidates,
} from "@/fetch/role-assignments";

const assignment = {
	assignedAt: "2026-08-11T18:00:00Z",
	assignmentUuid: "assignment-uuid-1",
	role: "read_only",
	userEmail: "reader@example.test",
	userName: "Local Reader",
	userUuid: "user-uuid-1",
	workspaceUuid: "workspace-uuid-1",
};

const jsonResponse = (payload: unknown): Response =>
	({
		headers: new Headers({ "content-type": "application/json" }),
		json: () => Promise.resolve(payload),
		ok: true,
		status: 200,
	}) as Response;

describe("canonical role-assignment API", () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("uses the fixed CL Admin assignment endpoints with public user UUIDs", async () => {
		const fetchMock = vi
			.spyOn(globalThis, "fetch")
			.mockResolvedValueOnce(jsonResponse([assignment]))
			.mockResolvedValueOnce(
				jsonResponse({
					eligible: false,
					reason: "active_partner_access",
					userUuid: "user-uuid-1",
				})
			)
			.mockResolvedValueOnce(jsonResponse({ ...assignment, role: "cl_admin" }))
			.mockResolvedValueOnce(jsonResponse({ message: "revoked" }));

		await getClAdminRoleAssignments();
		await getClAdminAssignmentEligibility("user-uuid-1");
		await assignClAdminRole("user-uuid-1");
		await revokeClAdminRole("user-uuid-1");

		expect(fetchMock).toHaveBeenNthCalledWith(
			1,
			"http://localhost:8000/api/v1/role-assignments/cl-admin",
			expect.objectContaining({
				cache: "no-store",
				credentials: "include",
				method: "GET",
			})
		);
		expect(fetchMock).toHaveBeenNthCalledWith(
			2,
			"http://localhost:8000/api/v1/role-assignments/cl-admin/user-uuid-1/eligibility",
			expect.objectContaining({
				cache: "no-store",
				credentials: "include",
				method: "GET",
			})
		);
		expect(fetchMock).toHaveBeenNthCalledWith(
			3,
			"http://localhost:8000/api/v1/role-assignments/cl-admin",
			expect.objectContaining({
				body: JSON.stringify({ userUuid: "user-uuid-1" }),
				credentials: "include",
				method: "POST",
			})
		);
		expect(fetchMock).toHaveBeenNthCalledWith(
			4,
			"http://localhost:8000/api/v1/role-assignments/cl-admin/user-uuid-1",
			expect.objectContaining({
				credentials: "include",
				method: "DELETE",
			})
		);
	});

	it("uses explicit workspace list, candidate, assign, replace, and revoke operations", async () => {
		const fetchMock = vi
			.spyOn(globalThis, "fetch")
			.mockResolvedValueOnce(jsonResponse([assignment]))
			.mockResolvedValueOnce(
				jsonResponse([
					{
						email: "candidate@example.test",
						name: "Candidate",
						uuid: "candidate-uuid-1",
					},
				])
			)
			.mockResolvedValueOnce(jsonResponse(assignment))
			.mockResolvedValueOnce(
				jsonResponse({ ...assignment, role: "rp_user_edit" })
			)
			.mockResolvedValueOnce(jsonResponse({ message: "revoked" }));

		await getWorkspaceRoleAssignments("workspace-uuid-1");
		await searchWorkspaceRoleAssignmentCandidates(
			"workspace-uuid-1",
			"name@example.test"
		);
		await assignWorkspaceRole("workspace-uuid-1", {
			role: "read_only",
			userUuid: "candidate-uuid-1",
		});
		await replaceWorkspaceRole(
			"workspace-uuid-1",
			"candidate-uuid-1",
			"rp_user_edit"
		);
		await revokeWorkspaceRole("workspace-uuid-1", "candidate-uuid-1");

		const base = "http://localhost:8000/api/v1/workspaces/workspace-uuid-1";
		expect(fetchMock).toHaveBeenNthCalledWith(
			1,
			`${base}/role-assignments`,
			expect.objectContaining({ method: "GET" })
		);
		expect(fetchMock).toHaveBeenNthCalledWith(
			2,
			`${base}/role-assignment-candidates?q=name%40example.test`,
			expect.objectContaining({ method: "GET" })
		);
		expect(fetchMock).toHaveBeenNthCalledWith(
			3,
			`${base}/role-assignments`,
			expect.objectContaining({
				body: JSON.stringify({
					role: "read_only",
					userUuid: "candidate-uuid-1",
				}),
				method: "POST",
			})
		);
		expect(fetchMock).toHaveBeenNthCalledWith(
			4,
			`${base}/role-assignments/candidate-uuid-1`,
			expect.objectContaining({
				body: JSON.stringify({ role: "rp_user_edit" }),
				method: "PATCH",
			})
		);
		expect(fetchMock).toHaveBeenNthCalledWith(
			5,
			`${base}/role-assignments/candidate-uuid-1`,
			expect.objectContaining({ method: "DELETE" })
		);
	});

	it("uses the focused assignment UUID contract for direct record operations", async () => {
		const fetchMock = vi
			.spyOn(globalThis, "fetch")
			.mockResolvedValueOnce(jsonResponse(assignment))
			.mockResolvedValueOnce(
				jsonResponse({ ...assignment, role: "rp_user_edit" })
			)
			.mockResolvedValueOnce(jsonResponse({ message: "revoked" }));

		await getWorkspaceRoleAssignment("workspace/uuid", "assignment/uuid");
		await replaceWorkspaceRoleAssignment(
			"workspace/uuid",
			"assignment/uuid",
			"rp_user_edit"
		);
		await revokeWorkspaceRoleAssignment("workspace/uuid", "assignment/uuid");

		const url =
			"http://localhost:8000/api/v1/workspaces/workspace%2Fuuid/access/assignments/assignment%2Fuuid";
		expect(fetchMock).toHaveBeenNthCalledWith(
			1,
			url,
			expect.objectContaining({ cache: "no-store", method: "GET" })
		);
		expect(fetchMock).toHaveBeenNthCalledWith(
			2,
			url,
			expect.objectContaining({
				body: JSON.stringify({ role: "rp_user_edit" }),
				method: "PATCH",
			})
		);
		expect(fetchMock).toHaveBeenNthCalledWith(
			3,
			url,
			expect.objectContaining({ method: "DELETE" })
		);
	});
});
