import { afterEach, describe, expect, it, vi } from "vitest";
import {
	approvePost,
	createPost,
	getPendingReviewPosts,
	getUserPosts,
	rejectPost,
	submitPostForReview,
} from "@/fetch/posts";

describe("posts-api", () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("loads posts for a specific user", async () => {
		const userUuid = "019cfc22-bff2-7168-ae43-387a301d8fcb";
		const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
			json: () => Promise.resolve({
				data: [
					{
						created_at: "2026-03-18T00:00:00Z",
						created_by_user_id: 7,
						uuid: "018f6f83-0f2b-7b0f-b2fb-96c4d8a4b0f1",
						media_url: null,
						status: "draft",
						text: "Draft body",
						title: "Draft post",
					},
				],
				has_more: false,
				items_per_page: 25,
				page: 1,
				total_count: 1,
			}),
			ok: true,
			status: 200,
		} as Response);

		const response = await getUserPosts(userUuid, 1, 25);

		expect(fetchMock).toHaveBeenCalledWith(
			`http://localhost:8000/api/v1/user/${userUuid}/posts?items_per_page=25&page=1`,
			expect.objectContaining({
				credentials: "include",
				method: "GET",
			}),
		);
		expect(response["total_count"]).toBe(1);
		expect(response.data[0]).toMatchObject({
			status: "draft",
			title: "Draft post",
			uuid: "018f6f83-0f2b-7b0f-b2fb-96c4d8a4b0f1",
		});
	});

	it("creates and submits a post for review", async () => {
		const userUuid = "019cfc22-bff2-7168-ae43-387a301d8fcb";
		const postUuid = "018f6f83-0f2b-7b0f-b2fb-96c4d8a4b0f1";
		const fetchMock = vi.spyOn(globalThis, "fetch")
			.mockResolvedValueOnce({
				headers: new Headers({ "content-type": "application/json" }),
				json: () => Promise.resolve({
					created_at: "2026-03-18T00:00:00Z",
					created_by_user_id: 7,
					uuid: postUuid,
					media_url: null,
					status: "draft",
					text: "Body",
					title: "New post",
				}),
				ok: true,
				status: 201,
			} as Response)
			.mockResolvedValueOnce({
				headers: new Headers({ "content-type": "application/json" }),
				json: () => Promise.resolve({ message: "Post submitted for review" }),
				ok: true,
				status: 200,
			} as Response);

		await createPost(userUuid, { text: "Body", title: "New post" });
		await submitPostForReview(userUuid, postUuid);

		expect(fetchMock).toHaveBeenNthCalledWith(
			1,
			`http://localhost:8000/api/v1/user/${userUuid}/post`,
			expect.objectContaining({
				body: JSON.stringify({ text: "Body", title: "New post" }),
				method: "POST",
			}),
		);
		expect(fetchMock).toHaveBeenNthCalledWith(
			2,
			`http://localhost:8000/api/v1/user/${userUuid}/post/${postUuid}/submit-review`,
			expect.objectContaining({ method: "POST" }),
		);
	});

	it("loads pending review posts and sends review decisions", async () => {
		const approvedUuid = "018f6f83-0f2b-7b0f-b2fb-96c4d8a4b0f2";
		const rejectedUuid = "018f6f83-0f2b-7b0f-b2fb-96c4d8a4b0f3";
		const fetchMock = vi.spyOn(globalThis, "fetch")
			.mockResolvedValueOnce({
				json: () => Promise.resolve({
					data: [],
					has_more: false,
					items_per_page: 10,
					page: 1,
					total_count: 0,
				}),
				ok: true,
				status: 200,
			} as Response)
			.mockResolvedValueOnce({
				headers: new Headers({ "content-type": "application/json" }),
				json: () => Promise.resolve({ message: "Post approved" }),
				ok: true,
				status: 200,
			} as Response)
			.mockResolvedValueOnce({
				headers: new Headers({ "content-type": "application/json" }),
				json: () => Promise.resolve({ message: "Post rejected" }),
				ok: true,
				status: 200,
			} as Response);

		await getPendingReviewPosts(1, 10);
		await approvePost(approvedUuid, { comment: "Looks good" });
		await rejectPost(rejectedUuid, { comment: "Needs revisions" });

		expect(fetchMock).toHaveBeenNthCalledWith(
			1,
			"http://localhost:8000/api/v1/posts/pending-review?items_per_page=10&page=1",
			expect.objectContaining({ method: "GET" }),
		);
		expect(fetchMock).toHaveBeenNthCalledWith(
			2,
			`http://localhost:8000/api/v1/posts/${approvedUuid}/approve`,
			expect.objectContaining({
				body: JSON.stringify({ comment: "Looks good" }),
				method: "POST",
			}),
		);
		expect(fetchMock).toHaveBeenNthCalledWith(
			3,
			`http://localhost:8000/api/v1/posts/${rejectedUuid}/reject`,
			expect.objectContaining({
				body: JSON.stringify({ comment: "Needs revisions" }),
				method: "POST",
			}),
		);
	});

	it("omits a blank media url from create payloads", async () => {
		const userUuid = "019cfc22-bff2-7168-ae43-387a301d8fcb";
		const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
			headers: new Headers({ "content-type": "application/json" }),
			json: () => Promise.resolve({
				created_at: "2026-03-18T00:00:00Z",
				created_by_user_id: 7,
				uuid: "018f6f83-0f2b-7b0f-b2fb-96c4d8a4b0f1",
				media_url: null,
				status: "draft",
				text: "Body",
				title: "New post",
			}),
			ok: true,
			status: 201,
		} as Response);

		await createPost(userUuid, { mediaUrl: "", text: "Body", title: "New post" });

		expect(fetchMock).toHaveBeenCalledWith(
			`http://localhost:8000/api/v1/user/${userUuid}/post`,
			expect.objectContaining({
				body: JSON.stringify({ text: "Body", title: "New post" }),
				method: "POST",
			}),
		);
	});
});