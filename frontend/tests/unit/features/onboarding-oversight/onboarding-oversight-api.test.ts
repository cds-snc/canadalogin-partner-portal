import { afterEach, describe, expect, it, vi } from "vitest";
import { normalizeOnboardingOversightQueueFilters } from "@/features/onboarding-oversight/queue-filters";
import { getOnboardingOversightQueue } from "@/fetch/onboarding-oversight";

describe("Production-review oversight API", () => {
	afterEach(() => vi.restoreAllMocks());

	it("normalizes only workspace, department, and constrained review status", () => {
		expect(
			normalizeOnboardingOversightQueueFilters({
				department: " Employment ",
				legacyFilter: "ignored",
				review_status: "pending",
				workspace: " Benefits ",
			})
		).toEqual({
			department: "Employment",
			reviewStatus: "pending",
			workspace: "Benefits",
		});
		expect(
			normalizeOnboardingOversightQueueFilters({ reviewStatus: "launched" })
		).toEqual({
			department: undefined,
			reviewStatus: undefined,
			workspace: undefined,
		});
	});

	it("loads the explicit Production-review queue with narrow query fields", async () => {
		const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
			headers: new Headers({ "content-type": "application/json" }),
			json: () => Promise.resolve([]),
			ok: true,
			status: 200,
		} as Response);

		await getOnboardingOversightQueue({
			department: "Employment",
			reviewStatus: "pending",
			workspace: "Benefits",
		});

		expect(fetchMock).toHaveBeenCalledWith(
			"http://localhost:8000/api/v1/onboarding-oversight/production-reviews?department=Employment&review_status=pending&workspace=Benefits",
			expect.objectContaining({
				cache: "no-store",
				credentials: "include",
				method: "GET",
			})
		);
	});
});
