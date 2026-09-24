import { afterEach, describe, expect, it, vi } from "vitest";
import { getApplicationEnvironments } from "@/fetch/application-environments";

describe("application-environments API", () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("gets a paginated application environment list", async () => {
		const applicationUuid = "application-uuid-1";
		const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
			headers: new Headers({ "content-type": "application/json" }),
			json: () =>
				Promise.resolve({
					application: {
						nameEn: "Benefits portal",
						nameFr: null,
						uuid: applicationUuid,
					},
					data: [],
					hasMore: false,
					itemsPerPage: 10,
					page: 2,
					totalCount: 0,
				}),
			ok: true,
			status: 200,
		} as Response);

		const response = await getApplicationEnvironments(applicationUuid, {
			itemsPerPage: 10,
			page: 2,
		});

		expect(fetchMock).toHaveBeenCalledWith(
			`http://localhost:8000/api/v1/applications/${applicationUuid}/environments?items_per_page=10&page=2`,
			expect.objectContaining({
				cache: "no-store",
				credentials: "include",
				method: "GET",
			})
		);
		expect(response.page).toBe(2);
		expect(response.application.nameEn).toBe("Benefits portal");
	});
});