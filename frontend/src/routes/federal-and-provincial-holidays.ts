import { createFileRoute } from "@tanstack/react-router";
import FederalAndProvincialHolidays from "../pages/FederalAndProvincialHolidays";

export const Route = createFileRoute("/federal-and-provincial-holidays")({
	component: FederalAndProvincialHolidays,
});
