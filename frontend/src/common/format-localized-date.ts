export const formatLocalizedDate = (
	value: string,
	language: string
): string => {
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return value;

	return new Intl.DateTimeFormat(
		language.startsWith("fr") ? "fr-CA" : "en-CA",
		{ dateStyle: "long" }
	).format(date);
};
