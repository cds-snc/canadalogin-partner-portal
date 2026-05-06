import { createFileRoute } from "@tanstack/react-router";
import OptionalHolidays from "../pages/OptionalHolidays";

export const Route = createFileRoute("/optional-holidays")({
	component: OptionalHolidays,
});
