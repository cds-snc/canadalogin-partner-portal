import type {
	RPApplicationSettings,
	RPApplicationRotatedSecretRead,
} from "@/fetch/workspaces";

export type AppFormState = {
	applicationUrl: string;
	clientType: "public" | "confidential";
	companyName: string;
	description: string;
	name: string;
	pkceEnabled: boolean;
	redirectUris: string;
};

export type RotatedSecretFormState = {
	description: string;
	expiresAt: string;
};

export type RotatedSecretListItem = RPApplicationRotatedSecretRead;

export const addDays = (date: Date, days: number): Date =>
	new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);

export const formatDateValue = (date: Date): string => {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");

	return `${year}-${month}-${day}`;
};

export const getRotatedSecretForm = (): RotatedSecretFormState => ({
	description: "",
	expiresAt: formatDateValue(addDays(new Date(), 30)),
});

export const formatTimestamp = (value: number | null | undefined): string => {
	if (typeof value !== "number" || Number.isNaN(value)) {
		return "-";
	}

	return new Date(value * 1000).toLocaleDateString(undefined, {
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
	});
};

export const emptyAppForm = (): AppFormState => ({
	applicationUrl: "",
	clientType: "confidential",
	companyName: "",
	description: "",
	name: "",
	pkceEnabled: false,
	redirectUris: "",
});

export const getSettingString = (
	settings: RPApplicationSettings | null | undefined,
	key: "application_url" | "company_name" | "description"
): string => {
	const value = settings?.[key];
	return typeof value === "string" ? value : "";
};

export const getSettingBoolean = (
	settings: RPApplicationSettings | null | undefined,
	key: "pkce_enabled"
): boolean => settings?.[key] === true;

export const getSettingClientType = (
	settings: RPApplicationSettings | null | undefined
): "public" | "confidential" =>
	settings?.["client_type"] === "public" ? "public" : "confidential";

export const getRedirectUrisValue = (
	settings: RPApplicationSettings | null | undefined
): string => {
	const redirectUris = settings?.redirect_uris;
	if (!Array.isArray(redirectUris)) {
		return "";
	}

	return redirectUris
		.filter(
			(value): value is string =>
				typeof value === "string" && value.trim().length > 0
		)
		.join("\n");
};

export const parseRedirectUris = (value: string): Array<string> =>
	value
		.split(/\r?\n|,/)
		.map((entry) => entry.trim())
		.filter((entry) => entry.length > 0);

export const getClientValue = (value: string | null | undefined): string =>
	value && value.trim().length > 0 ? value : "-";
