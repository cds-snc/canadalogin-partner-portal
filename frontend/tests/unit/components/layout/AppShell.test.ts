import { describe, expect, it } from "vitest";
import { getPageLastUpdated } from "@/components/layout/page-last-updated";

describe("AppShell date modified metadata", () => {
	it("keeps date modified on static content pages", () => {
		expect(getPageLastUpdated("/support")).toBe("2026-08-12");
		expect(getPageLastUpdated("/terms-and-conditions")).toBe("2026-08-12");
	});

	it("omits date modified from transactional pages", () => {
		expect(getPageLastUpdated("/")).toBeNull();
		expect(getPageLastUpdated("/workspaces/workspace-uuid-1")).toBeNull();
		expect(getPageLastUpdated("/reports")).toBeNull();
	});
});
