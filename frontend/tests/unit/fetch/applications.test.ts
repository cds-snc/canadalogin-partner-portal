import { describe, expect, it, vi } from "vitest";
import { getCurrentUserApplications } from "@/fetch/applications";

const { mockedRequestJson } = vi.hoisted(() => ({
	mockedRequestJson: vi.fn(),
}));

vi.mock("@/fetch", () => ({
	requestJson: mockedRequestJson,
}));

describe("getCurrentUserApplications", () => {
	it("requests the selected server page", async () => {
		const response = {
			data: [],
			hasMore: true,
			itemsPerPage: 10,
			page: 2,
			totalCount: 11,
		};
		mockedRequestJson.mockResolvedValue(response);

		await expect(
			getCurrentUserApplications({ itemsPerPage: 10, page: 2 })
		).resolves.toEqual(response);
		expect(mockedRequestJson).toHaveBeenCalledWith(
			"/api/v1/applications/mine?items_per_page=10&page=2",
			{
				cache: "no-store",
				method: "GET",
			}
		);
	});
});