import { describe, expect, it } from "vitest";
import * as sessionQueries from "@/features/auth/session-queries";

describe("session-queries", () => {
	it("does not expose a separate auth hydration helper", () => {
		expect("ensureCurrentUser" in sessionQueries).toBe(false);
	});
});