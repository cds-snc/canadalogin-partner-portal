import { afterEach, describe, expect, it, vi } from "vitest";
import { UnauthorizedRequestError } from "@/fetch";
import {
	getPendingUserInvitations,
	getUserAccessAdministration,
	getUsers,
	resolveUserInvitationTarget,
	searchUsers,
} from "@/fetch/users";

describe("users-api", () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("requests the backend users list with pagination parameters", async () => {
		const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
			json: () =>
				Promise.resolve({
					data: [
						{
							enabled: true,
							uuid: "018f6f83-0f2b-7b0f-b2fb-96c4d8a4b101",
						},
					],
					has_more: false,
					items_per_page: 20,
					page: 2,
					total_count: 1,
				}),
			ok: true,
		} as Response);

		const response = await getUsers(2, 20);

		expect(fetchMock).toHaveBeenCalledWith(
			"http://localhost:8000/api/v1/users?items_per_page=20&page=2",
			expect.objectContaining({
				credentials: "include",
				method: "GET",
			})
		);
		expect(response).toMatchObject({
			data: [
				{
					enabled: true,
					uuid: "018f6f83-0f2b-7b0f-b2fb-96c4d8a4b101",
				},
			],
			has_more: false,
			items_per_page: 20,
			page: 2,
			total_count: 1,
		});
	});

	it("requests the CL Admin pending invitation directory", async () => {
		const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
			headers: new Headers({ "content-type": "application/json" }),
			json: () =>
				Promise.resolve({
					data: [
						{
							invitationUuid: "invitation-uuid-1",
							invitedEmail: "invitee@example.test",
							status: "pending",
							workspaceUuid: "workspace-uuid-1",
						},
					],
					has_more: false,
					items_per_page: 10,
					page: 1,
					total_count: 1,
				}),
			ok: true,
			status: 200,
		} as Response);

		const response = await getPendingUserInvitations(1, 10);

		expect(fetchMock).toHaveBeenCalledWith(
			"http://localhost:8000/api/v1/users/invitations?items_per_page=10&page=1",
			expect.objectContaining({
				cache: "no-store",
				credentials: "include",
				method: "GET",
			})
		);
		expect(response.data[0]?.invitedEmail).toBe("invitee@example.test");
	});

	it("throws an unauthorized error when the backend session has expired", async () => {
		vi.spyOn(globalThis, "fetch").mockResolvedValue({
			ok: false,
			status: 401,
		} as Response);

		await expect(getUsers()).rejects.toBeInstanceOf(UnauthorizedRequestError);
	});

	it("searches the complete CL Admin user directory with an encoded query", async () => {
		const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
			headers: new Headers({ "content-type": "application/json" }),
			json: () =>
				Promise.resolve([
					{
						email: "outside.page@example.test",
						name: "Outside Page",
						uuid: "user-outside-page",
					},
				]),
			ok: true,
			status: 200,
		} as Response);

		const response = await searchUsers(" outside.page@example.test ");

		expect(fetchMock).toHaveBeenCalledWith(
			"http://localhost:8000/api/v1/users/search?q=outside.page%40example.test",
			expect.objectContaining({ credentials: "include", method: "GET" })
		);
		expect(response[0]?.uuid).toBe("user-outside-page");
	});

	it("loads a safe cross-workspace access summary", async () => {
		const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
			headers: new Headers({ "content-type": "application/json" }),
			json: () =>
				Promise.resolve({
					globalAssignment: null,
					pendingInvitations: [],
					user: {
						email: "person@example.test",
						enabled: true,
						name: "Person One",
						username: "person@example.test",
						uuid: "user/uuid",
					},
					workspaceAssignments: [],
				}),
			ok: true,
			status: 200,
		} as Response);

		const response = await getUserAccessAdministration("user/uuid");

		expect(fetchMock).toHaveBeenCalledWith(
			"http://localhost:8000/api/v1/users/user%2Fuuid/access",
			expect.objectContaining({
				cache: "no-store",
				credentials: "include",
				method: "GET",
			})
		);
		expect(response.user).not.toHaveProperty("authProvider");
	});

	it("resolves whether an invitation target already has an identity", async () => {
		const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
			headers: new Headers({ "content-type": "application/json" }),
			json: () =>
				Promise.resolve({
					outcome: "existing_identity",
					userUuid: "user-uuid-1",
				}),
			ok: true,
			status: 200,
		} as Response);

		const response = await resolveUserInvitationTarget("Person@Example.Test");

		expect(fetchMock).toHaveBeenCalledWith(
			"http://localhost:8000/api/v1/users/invitation-target-resolution",
			expect.objectContaining({
				body: JSON.stringify({ invitedEmail: "Person@Example.Test" }),
				credentials: "include",
				method: "POST",
			})
		);
		expect(response).toEqual({
			outcome: "existing_identity",
			userUuid: "user-uuid-1",
		});
	});
});
