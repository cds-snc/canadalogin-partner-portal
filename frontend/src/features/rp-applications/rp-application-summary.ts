export const getLocalizedRPApplicationName = (
	application: { serviceNameEn: string; serviceNameFr: string },
	language: string
): string => {
	const useFrench = language.toLowerCase().startsWith("fr");
	const preferred = useFrench
		? application.serviceNameFr
		: application.serviceNameEn;
	const fallback = useFrench
		? application.serviceNameEn
		: application.serviceNameFr;
	return preferred.trim() || fallback.trim();
};
