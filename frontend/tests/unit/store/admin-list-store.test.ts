import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { adminListStore, resetAdminListStore } from "@/store";

describe("adminListStore", () => {
	beforeEach(() => {
		resetAdminListStore();
	});

	afterEach(() => {
		resetAdminListStore();
	});

	it("tracks the focused Users and access list state", () => {
		adminListStore.getState().setPage("users", 3);
		adminListStore.getState().setSearchDraft("users", "jane");

		expect(adminListStore.getState().lists.users).toEqual({
			page: 3,
			searchDraft: "jane",
		});
	});

	it("resets the Users and access list state", () => {
		adminListStore.getState().setPage("users", 4);
		adminListStore.getState().setSearchDraft("users", "jane");

		adminListStore.getState().resetListState("users");

		expect(adminListStore.getState().lists.users).toEqual({
			page: 1,
			searchDraft: "",
		});
	});
});
