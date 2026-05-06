import { Outlet } from "@tanstack/react-router";
import { describe, expect, it } from "vitest";
import { Route as WorkspacesWorkspaceRoute } from "@/routes/workspaces/$workspaceUuid";
import { Route as RPApplicationRoute } from "@/routes/workspaces/$workspaceUuid/applications/$rpApplicationUuid";

describe("workspaces workspace route", () => {
	it("acts as a layout route so nested RP application routes can render", () => {
		const component = WorkspacesWorkspaceRoute.options.component;
		expect(component).toBeTypeOf("function");

		const rendered = (component as () => { type: unknown })();
		expect(rendered.type).toBe(Outlet);
	});

	it("uses the RP application parent route as a layout so the usage child route can render", () => {
		const component = RPApplicationRoute.options.component;
		expect(component).toBeTypeOf("function");

		const rendered = (component as () => { type: unknown })();
		expect(rendered.type).toBe(Outlet);
	});
});