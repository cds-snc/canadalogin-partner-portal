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

export const getRPConfigurationDisplayName = (
	application: {
		configurationName?: string | null;
		serviceNameEn: string;
		serviceNameFr: string;
	},
	language: string,
	unknownLabel: string
): string =>
	application.configurationName?.trim() ||
	getLocalizedRPApplicationName(application, language) ||
	unknownLabel;

const getReferenceSource = (uuid: string): string =>
	uuid.toLowerCase().replace(/[^0-9a-f]/g, "");

export const buildRPConfigurationPublicReferences = (
	applications: ReadonlyArray<{
		canadaLoginEnvironment?: string | null;
		configurationName?: string | null;
		partnerEnvironment?: string | null;
		serviceNameEn: string;
		serviceNameFr: string;
		uuid: string;
	}>,
	language: string,
	unknownLabel: string
): ReadonlyMap<string, string> => {
	const groups = new Map<string, Array<(typeof applications)[number]>>();
	for (const application of applications) {
		const name = getRPConfigurationDisplayName(
			application,
			language,
			unknownLabel
		);
		const environment = application.canadaLoginEnvironment?.trim() ?? "";
		const partnerEnvironment = application.partnerEnvironment?.trim() ?? "";
		const key = `${name}\u0000${partnerEnvironment}\u0000${environment}`;
		groups.set(key, [...(groups.get(key) ?? []), application]);
	}

	const references = new Map<string, string>();
	for (const group of groups.values()) {
		if (group.length < 2) continue;
		const sources = group.map((application) => ({
			source: getReferenceSource(application.uuid),
			uuid: application.uuid,
		}));
		let referenceLength = 8;
		while (referenceLength < 32) {
			const prefixes = sources.map(({ source }) =>
				source.slice(0, referenceLength)
			);
			if (new Set(prefixes).size === prefixes.length) break;
			referenceLength += 4;
		}
		for (const { source, uuid } of sources) {
			references.set(uuid, source.slice(0, referenceLength));
		}
	}

	return references;
};
