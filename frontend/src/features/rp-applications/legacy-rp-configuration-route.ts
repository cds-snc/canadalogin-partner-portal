import {
	getAccessibleRPApplication,
	type AccessibleRPApplicationRead,
	type RPApplicationSummaryRead,
} from "@/fetch/rp-applications";
import { getApplicationInformation } from "@/fetch/workspaces";

const LEGACY_SUFFIX_MAP: Readonly<Record<string, string>> = {
	"": "",
	"/configuration": "/configuration",
	"/manage-credentials": "/manage-credentials",
	"/mau-report": "/usage",
	"/usage": "/usage",
};

const normalizeLegacySuffix = (suffix: string): string | null => {
	if (suffix in LEGACY_SUFFIX_MAP) return LEGACY_SUFFIX_MAP[suffix] ?? null;
	if (
		/^\/registration\/(?:basics|endpoints|client-and-access|signing|encryption|review|confirmation)$/.test(
			suffix
		)
	) {
		return suffix;
	}
	return null;
};

export const buildCanonicalRPConfigurationPath = (
	configuration:
		| AccessibleRPApplicationRead
		| Pick<
				RPApplicationSummaryRead,
				"applicationInformationUuid" | "uuid" | "workspaceUuid"
		  >,
	legacySuffix = ""
): string | null => {
	const applicationUuid = configuration.applicationInformationUuid?.trim();
	const suffix = normalizeLegacySuffix(legacySuffix);
	if (!applicationUuid || suffix === null) return null;

	return `/workspaces/${encodeURIComponent(configuration.workspaceUuid)}/applications/${encodeURIComponent(applicationUuid)}/rp-configurations/${encodeURIComponent(configuration.uuid)}${suffix}`;
};

export const resolveLegacyRPConfigurationPath = async ({
	expectedWorkspaceUuid,
	legacySuffix = "",
	rpConfigurationUuid,
}: {
	expectedWorkspaceUuid?: string;
	legacySuffix?: string;
	rpConfigurationUuid: string;
}): Promise<string | null> => {
	let configuration: AccessibleRPApplicationRead;
	try {
		configuration = await getAccessibleRPApplication(rpConfigurationUuid);
	} catch {
		return null;
	}
	if (
		expectedWorkspaceUuid &&
		configuration.workspaceUuid !== expectedWorkspaceUuid
	) {
		return null;
	}
	return buildCanonicalRPConfigurationPath(configuration, legacySuffix);
};

export type WorkspaceApplicationResourceResolution =
	| { kind: "application" }
	| { href: string; kind: "legacyRedirect" }
	| { kind: "unavailable" };

export const resolveWorkspaceApplicationResource = async ({
	legacySuffix = "",
	resourceUuid,
	workspaceUuid,
}: {
	legacySuffix?: string;
	resourceUuid: string;
	workspaceUuid: string;
}): Promise<WorkspaceApplicationResourceResolution> => {
	try {
		await getApplicationInformation(workspaceUuid, resourceUuid);
		return { kind: "application" };
	} catch {
		// The old route used this UUID namespace for RP records. The compatibility
		// lookup remains server-scoped and is attempted only when no Application
		// can be resolved in the selected workspace.
	}

	try {
		const href = await resolveLegacyRPConfigurationPath({
			expectedWorkspaceUuid: workspaceUuid,
			legacySuffix,
			rpConfigurationUuid: resourceUuid,
		});
		return href ? { href, kind: "legacyRedirect" } : { kind: "unavailable" };
	} catch {
		return { kind: "unavailable" };
	}
};
