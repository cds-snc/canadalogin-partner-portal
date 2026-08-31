import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	createDepartment,
	deleteDepartment,
	getDepartments,
	updateDepartment,
} from "@/fetch/departments";

describe("departments-api", () => {
	const originalFetch = globalThis.fetch;

	beforeEach(() => {
		vi.unstubAllEnvs();
		vi.stubEnv("VITE_API_BASE_URL", "http://localhost:8000");
	});

	afterEach(() => {
		globalThis.fetch = originalFetch;
		vi.restoreAllMocks();
	});

	it("requests the backend departments list with pagination parameters", async () => {
		globalThis.fetch = vi.fn().mockResolvedValue({
			json: () => Promise.resolve({
				data: [{ uuid: "018f6f83-0f2b-7b0f-b2fb-96c4d8a4b501", name: "Engineering", created_at: "2026-03-23T00:00:00Z" }],
				"has_more": false,
				"items_per_page": 20,
				page: 2,
				"total_count": 1,
			}),
			ok: true,
		} as Response) as typeof fetch;

		const response = await getDepartments(2, 20);

		expect(globalThis.fetch).toHaveBeenCalledWith(
			"http://localhost:8000/api/v1/departments?items_per_page=20&page=2",
			expect.objectContaining({
				credentials: "include",
				method: "GET",
			}),
		);
		expect(response.data[0]).toMatchObject({ name: "Engineering", uuid: "018f6f83-0f2b-7b0f-b2fb-96c4d8a4b501" });
	});

	it("creates a department through the backend write endpoint", async () => {
		const payload = {
			abbreviation: "ENG",
			abbreviation_fr: "ING",
			gc_org_id: 42,
			lead_department_name: "Treasury Board of Canada Secretariat",
			lead_department_name_fr: "Secretariat du Conseil du Tresor du Canada",
			name: "People Ops",
			name_fr: "Operations du personnel",
		};

		globalThis.fetch = vi.fn().mockResolvedValue({
			json: () => Promise.resolve({ uuid: "018f6f83-0f2b-7b0f-b2fb-96c4d8a4b502", name: "People Ops", created_at: "2026-03-23T00:00:00Z" }),
			ok: true,
		} as Response) as typeof fetch;

		await createDepartment(payload);

		expect(globalThis.fetch).toHaveBeenCalledWith(
			"http://localhost:8000/api/v1/department",
			expect.objectContaining({
				body: JSON.stringify(payload),
				credentials: "include",
				method: "POST",
			}),
		);
	});

	it("updates a department through the backend patch endpoint", async () => {
		const departmentUuid = "018f6f83-0f2b-7b0f-b2fb-96c4d8a4b501";
		const payload = {
			abbreviation: "OPS",
			abbreviation_fr: "OPS",
			gc_org_id: 108,
			lead_department_name: "Shared Services Canada",
			lead_department_name_fr: "Services partages Canada",
			name: "Operations",
			name_fr: "Operations",
		};
		globalThis.fetch = vi.fn().mockResolvedValue({
			json: () => Promise.resolve({ message: "Department updated" }),
			ok: true,
		} as Response) as typeof fetch;

		await updateDepartment(departmentUuid, payload);

		expect(globalThis.fetch).toHaveBeenCalledWith(
			`http://localhost:8000/api/v1/department/${departmentUuid}`,
			expect.objectContaining({
				body: JSON.stringify(payload),
				credentials: "include",
				method: "PATCH",
			}),
		);
	});

	it("deletes a department through the backend erase endpoint", async () => {
		const departmentUuid = "018f6f83-0f2b-7b0f-b2fb-96c4d8a4b501";
		globalThis.fetch = vi.fn().mockResolvedValue({
			json: () => Promise.resolve({ message: "Department deleted" }),
			ok: true,
		} as Response) as typeof fetch;

		await deleteDepartment(departmentUuid);

		expect(globalThis.fetch).toHaveBeenCalledWith(
			`http://localhost:8000/api/v1/department/${departmentUuid}`,
			expect.objectContaining({
				credentials: "include",
				method: "DELETE",
			}),
		);
	});
});