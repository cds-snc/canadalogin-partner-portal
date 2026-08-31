import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { adminListStore, resetAdminListStore } from "@/store";

describe("adminListStore", () => {
	beforeEach(() => {
		resetAdminListStore();
	});

	afterEach(() => {
		resetAdminListStore();
	});

	it("tracks page and search draft independently per resource", () => {
		adminListStore.getState().setPage("users", 3);
		adminListStore.getState().setSearchDraft("users", "jane");
		adminListStore.getState().setPage("roles", 2);

		expect(adminListStore.getState().lists.users).toEqual({
			page: 3,
			searchDraft: "jane",
		});
		expect(adminListStore.getState().lists.roles).toEqual({
			page: 2,
			searchDraft: "",
		});
	});

	it("resets one resource without affecting the others", () => {
		adminListStore.getState().setPage("policies", 4);
		adminListStore.getState().setSearchDraft("policies", "subject:admin");
		adminListStore.getState().setPage("tiers", 2);

		adminListStore.getState().resetListState("policies");

		expect(adminListStore.getState().lists.policies).toEqual({
			page: 1,
			searchDraft: "",
		});
		expect(adminListStore.getState().lists.tiers).toEqual({
			page: 2,
			searchDraft: "",
		});
	});
});