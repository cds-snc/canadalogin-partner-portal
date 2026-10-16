import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	getCurrentUserApplicationByUuid,
	getCurrentUserApplications,
} from "@/fetch/applications";

const { mockedRequestJson } = vi.hoisted(() => ({
	mockedRequestJson: vi.fn(),
}));

vi.mock("@/fetch", () => ({
	requestJson: mockedRequestJson,
}));

beforeEach(() => {
	mockedRequestJson.mockReset();
});

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

describe("getCurrentUserApplicationByUuid", () => {
	it("follows pagination until it finds the requested application", async () => {
		mockedRequestJson
			.mockResolvedValueOnce({
				data: [
					{
						environmentCount: 0,
						nameEn: "First application",
						nameFr: null,
						uuid: "application-uuid-1",
					},
				],
				hasMore: true,
				itemsPerPage: 1,
				page: 1,
				totalCount: 2,
			})
			.mockResolvedValueOnce({
				data: [
					{
						environmentCount: 2,
						nameEn: "Benefits Portal",
						nameFr: "Portail des prestations",
						uuid: "application-uuid-2",
					},
				],
				hasMore: false,
				itemsPerPage: 1,
				page: 2,
				totalCount: 2,
			});

		await expect(
			getCurrentUserApplicationByUuid("application-uuid-2")
		).resolves.toMatchObject({
			nameEn: "Benefits Portal",
			uuid: "application-uuid-2",
		});
		expect(mockedRequestJson).toHaveBeenCalledTimes(2);
		expect(mockedRequestJson).toHaveBeenNthCalledWith(
			1,
			"/api/v1/applications/mine?items_per_page=100&page=1",
			expect.any(Object)
		);
		expect(mockedRequestJson).toHaveBeenNthCalledWith(
			2,
			"/api/v1/applications/mine?items_per_page=100&page=2",
			expect.any(Object)
		);
	});

	it("returns null when the application is not found", async () => {
		mockedRequestJson.mockResolvedValue({
			data: [],
			hasMore: false,
			itemsPerPage: 100,
			page: 1,
			totalCount: 0,
		});

		await expect(
			getCurrentUserApplicationByUuid("missing-application")
		).resolves.toBeNull();
	});
});