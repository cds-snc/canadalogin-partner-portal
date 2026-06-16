import { createFileRoute, useSearch } from "@tanstack/react-router";
import { createElement } from "react";
import {
	GenericErrorPage,
	type GenericErrorKind,
} from "../features/errors/pages/GenericErrorPage";

type GenericErrorSearch = {
	kind: GenericErrorKind;
};

const normalizeErrorKind = (value: unknown): GenericErrorKind =>
	value === "not_found" || value === "unexpected" ? value : "unexpected";

const validateSearch = (
	search: Record<string, unknown>
): GenericErrorSearch => ({
	kind: normalizeErrorKind(search["kind"]),
});

const GenericErrorRouteComponent = (): ReturnType<typeof GenericErrorPage> => {
	const { kind } = useSearch({ from: "/error" });
	return createElement(GenericErrorPage, { kind });
};

export const Route = createFileRoute("/error")({
	component: GenericErrorRouteComponent,
	validateSearch,
});
