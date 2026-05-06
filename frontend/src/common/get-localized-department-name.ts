import { normalizeLanguageCode } from "@/common/language";

type DepartmentNameFields = {
	name?: string | null;
	nameFr?: string | null;
};

const getNonEmptyValue = (
	...values: Array<string | null | undefined>
): string | undefined =>
	values.find(
		(value): value is string =>
			typeof value === "string" && value.trim().length > 0
	);

export const getLocalizedDepartmentName = (
	department: DepartmentNameFields | null | undefined,
	language?: string | null,
	fallback: string | undefined = "-"
): string | undefined => {
	if (!department) {
		return fallback;
	}

	const normalizedLanguage = normalizeLanguageCode(language);

	if (normalizedLanguage === "fr") {
		return getNonEmptyValue(department.nameFr, department.name) ?? fallback;
	}

	return getNonEmptyValue(department.name, department.nameFr) ?? fallback;
};