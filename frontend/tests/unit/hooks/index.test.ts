import { describe, expect, it } from "vitest";
import {
	useDepartmentManagement,
	useDepartments,
	useSession,
	useSystemStatus,
	useUserDepartment,
	useUserManagement,
	useUsers,
} from "@/hooks";

describe("hooks index", () => {
	it("re-exports the feature hooks from src/hooks", () => {
		expect(useDepartmentManagement).toBeTypeOf("function");
		expect(useDepartments).toBeTypeOf("function");
		expect(useSession).toBeTypeOf("function");
		expect(useUsers).toBeTypeOf("function");
		expect(useSystemStatus).toBeTypeOf("function");
		expect(useUserDepartment).toBeTypeOf("function");
		expect(useUserManagement).toBeTypeOf("function");
	});
});
