import { afterEach, describe, expect, it, vi } from "vitest";
import { mauReportQueryKey } from "@/features/mau-reports/hooks/use-mau-report";
import { getAccessibleRPApplicationMauReport } from "@/fetch/mau-report";

describe("accessible RP application MAU report API", () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("loads the report through the accessible application child route", async () => {
		const applicationUuid = "application-uuid-1";
		const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
			headers: new Headers({ "content-type": "application/json" }),
			json: () =>
				Promise.resolve({
					application_name: "Benefits Portal",
					end_date: "2026-08-10",
					records: [],
					start_date: "2026-08-01",
				}),
			ok: true,
			status: 200,
		} as Response);

		const response = await getAccessibleRPApplicationMauReport(
			applicationUuid,
			{
				endDate: "2026-08-10",
				startDate: "2026-08-01",
				workspaceUuid: "workspace-uuid-1",
			}
		);

		expect(fetchMock).toHaveBeenCalledWith(
			`http://localhost:8000/api/v1/rp-applications/accessible/${applicationUuid}/mau-report?start_date=2026-08-01&end_date=2026-08-10&workspaceUuid=workspace-uuid-1`,
			expect.objectContaining({
				cache: "no-store",
				credentials: "include",
				method: "GET",
			})
		);
		expect(response.application_name).toBe("Benefits Portal");
	});

	it("names report queries under the accessible application cache scope", () => {
		expect(
			mauReportQueryKey(
				"workspace-uuid-1",
				"application-uuid-1",
				"2026-08-01",
				"2026-08-10"
			)
		).toEqual([
			"rp-applications",
			"accessible",
			"workspace-uuid-1",
			"application-uuid-1",
			"mau-report",
			"2026-08-01",
			"2026-08-10",
		]);
	});
});
