type OptionDefinition<TValue extends string> = {
	labelKey: string;
	legacyValues?: Array<string>;
	value: TValue;
};

export type AuthenticationProtocolValue =
	| "OIDC"
	| "SAML"
	| "BOTH_OIDC_AND_SAML"
	| "NONE";

export type IdentityProofingMethodValue =
	| "NONE"
	| "EXTERNAL_ID_PROVIDER"
	| "IN_PERSON_ID_PROVIDER"
	| "OTHER";

export type UserTypeValue =
	| "PUBLIC"
	| "ORGANIZATIONS_AND_BUSINESSES"
	| "OFFICIAL_REPRESENTATIVES";

export type PersonalInformationValue =
	| "FIRST_NAME"
	| "LAST_NAME"
	| "EMAIL_ADDRESS"
	| "DATE_OF_BIRTH"
	| "ADDRESS";

export type CurrentSignInOptionValue =
	| "GC_KEY"
	| "INTERAC_SIGN_IN"
	| "ALBERTA_CA_ACCOUNT"
	| "BC_SERVICES_CARD"
	| "DEPARTMENT_CREDENTIAL"
	| "OTHER";

export type ConsolidatorUsedValue =
	| "NONE"
	| "GCCF_GCKEY_INTERAC_SAML"
	| "GCCF_CONSOLIDATOR_OIDC"
	| "SIGNIN_CANADA"
	| "ECAS";

export type CurrentMfaOptionValue =
	| "NONE"
	| "MFAAS_1"
	| "MFAAS_2"
	| "MFAAS_3"
	| "CUSTOM_INTERNAL";

export const AUTHENTICATION_PROTOCOL_OPTIONS: ReadonlyArray<
	OptionDefinition<AuthenticationProtocolValue>
> = [
	{ labelKey: "workspaces.optionOidc", value: "OIDC" },
	{ labelKey: "workspaces.optionSaml", value: "SAML" },
	{
		labelKey: "workspaces.optionAuthenticationProtocolBoth",
		legacyValues: ["Both OIDC and SAML"],
		value: "BOTH_OIDC_AND_SAML",
	},
	{
		labelKey: "workspaces.optionAuthenticationProtocolNone",
		legacyValues: ["None"],
		value: "NONE",
	},
];

export const IDENTITY_PROOFING_OPTIONS: ReadonlyArray<
	OptionDefinition<IdentityProofingMethodValue>
> = [
	{
		labelKey: "workspaces.optionIdentityProofingNone",
		legacyValues: ["It does not"],
		value: "NONE",
	},
	{
		labelKey: "workspaces.optionIdentityProofingExternal",
		legacyValues: ["External ID provider", "Sign-in partner"],
		value: "EXTERNAL_ID_PROVIDER",
	},
	{
		labelKey: "workspaces.optionIdentityProofingInPerson",
		legacyValues: ["In-person ID provider"],
		value: "IN_PERSON_ID_PROVIDER",
	},
	{
		labelKey: "workspaces.optionIdentityProofingOther",
		legacyValues: ["Other (Please specify)"],
		value: "OTHER",
	},
];

export const USER_TYPE_OPTIONS: ReadonlyArray<OptionDefinition<UserTypeValue>> = [
	{
		labelKey: "workspaces.optionUserTypePublic",
		legacyValues: ["Members of the public"],
		value: "PUBLIC",
	},
	{
		labelKey: "workspaces.optionUserTypeBusinesses",
		legacyValues: ["Organizations or businesses"],
		value: "ORGANIZATIONS_AND_BUSINESSES",
	},
	{
		labelKey: "workspaces.optionUserTypeOfficials",
		legacyValues: [
			"Official representatives for service users (e.g. lawyers, accountants, advocates)",
		],
		value: "OFFICIAL_REPRESENTATIVES",
	},
];

export const PERSONAL_INFORMATION_OPTIONS: ReadonlyArray<
	OptionDefinition<PersonalInformationValue>
> = [
	{
		labelKey: "workspaces.optionPersonalInformationFirstName",
		legacyValues: ["First name"],
		value: "FIRST_NAME",
	},
	{
		labelKey: "workspaces.optionPersonalInformationLastName",
		legacyValues: ["Last name"],
		value: "LAST_NAME",
	},
	{
		labelKey: "workspaces.optionPersonalInformationEmail",
		legacyValues: ["Email address"],
		value: "EMAIL_ADDRESS",
	},
	{
		labelKey: "workspaces.optionPersonalInformationDateOfBirth",
		legacyValues: ["Date of birth"],
		value: "DATE_OF_BIRTH",
	},
	{
		labelKey: "workspaces.optionPersonalInformationAddress",
		legacyValues: ["Address (mailing or residential not specified)"],
		value: "ADDRESS",
	},
];

export const CURRENT_SIGN_IN_OPTIONS: ReadonlyArray<
	OptionDefinition<CurrentSignInOptionValue>
> = [
	{
		labelKey: "workspaces.optionSignInGcKey",
		legacyValues: ["GCKey"],
		value: "GC_KEY",
	},
	{
		labelKey: "workspaces.optionSignInInteract",
		legacyValues: ["Interac sign in"],
		value: "INTERAC_SIGN_IN",
	},
	{
		labelKey: "workspaces.optionSignInAlberta",
		legacyValues: ["Alberta.ca Account (provincial partner)"],
		value: "ALBERTA_CA_ACCOUNT",
	},
	{
		labelKey: "workspaces.optionSignInBcServices",
		legacyValues: ["BC Services Card (provincial partner)"],
		value: "BC_SERVICES_CARD",
	},
	{
		labelKey: "workspaces.optionSignInDepartmentCredential",
		legacyValues: ["A credential specific to a department or service"],
		value: "DEPARTMENT_CREDENTIAL",
	},
	{
		labelKey: "workspaces.optionSignInOther",
		legacyValues: ["Others (Please specify)"],
		value: "OTHER",
	},
];

export const CONSOLIDATOR_OPTIONS: ReadonlyArray<
	OptionDefinition<ConsolidatorUsedValue>
> = [
	{
		labelKey: "workspaces.optionConsolidatorNone",
		legacyValues: ["No consolidator"],
		value: "NONE",
	},
	{
		labelKey: "workspaces.optionConsolidatorGccfSaml",
		legacyValues: ["GCCF GCKey & Interact sign in (SAML)"],
		value: "GCCF_GCKEY_INTERAC_SAML",
	},
	{
		labelKey: "workspaces.optionConsolidatorGccfOidc",
		legacyValues: ["GCCF Consolidator (OIDC)"],
		value: "GCCF_CONSOLIDATOR_OIDC",
	},
	{
		labelKey: "workspaces.optionConsolidatorSigninCanada",
		legacyValues: ["Signin Canada"],
		value: "SIGNIN_CANADA",
	},
	{
		labelKey: "workspaces.optionConsolidatorEcas",
		legacyValues: ["Enterprise Cyber Authentication Solution (ECAS)"],
		value: "ECAS",
	},
];

export const CURRENT_MFA_OPTIONS: ReadonlyArray<
	OptionDefinition<CurrentMfaOptionValue>
> = [
	{
		labelKey: "workspaces.optionMfaNone",
		legacyValues: ["No MFA"],
		value: "NONE",
	},
	{
		labelKey: "workspaces.optionMfaMfaas1",
		legacyValues: ["MFAaaS 1.0 (SMS/voice or email, API)"],
		value: "MFAAS_1",
	},
	{
		labelKey: "workspaces.optionMfaMfaas2",
		legacyValues: ["MFAaaS 2.0 (auth app or email, GUI)"],
		value: "MFAAS_2",
	},
	{
		labelKey: "workspaces.optionMfaMfaas3",
		legacyValues: [
			"MFAaaS 3.0 (auth app, email, SMS/voice, part of GCKey)",
		],
		value: "MFAAS_3",
	},
	{
		labelKey: "workspaces.optionMfaCustom",
		legacyValues: ["Custom MFA built internally"],
		value: "CUSTOM_INTERNAL",
	},
];

const LEGACY_VALUE_LOOKUP = new Map<string, string>(
	[
		...AUTHENTICATION_PROTOCOL_OPTIONS,
		...IDENTITY_PROOFING_OPTIONS,
		...USER_TYPE_OPTIONS,
		...PERSONAL_INFORMATION_OPTIONS,
		...CURRENT_SIGN_IN_OPTIONS,
		...CONSOLIDATOR_OPTIONS,
		...CURRENT_MFA_OPTIONS,
	].flatMap((option) =>
		(option.legacyValues ?? []).map((legacyValue) => [legacyValue, option.value])
	)
);

const LABEL_LOOKUP = new Map<string, string>(
	[
		...AUTHENTICATION_PROTOCOL_OPTIONS,
		...IDENTITY_PROOFING_OPTIONS,
		...USER_TYPE_OPTIONS,
		...PERSONAL_INFORMATION_OPTIONS,
		...CURRENT_SIGN_IN_OPTIONS,
		...CONSOLIDATOR_OPTIONS,
		...CURRENT_MFA_OPTIONS,
	].map((option) => [option.value, option.labelKey])
);

export const normalizeApplicationInfoEnumValue = (
	value: string | null | undefined
): string => {
	if (!value) {
		return "";
	}

	return LEGACY_VALUE_LOOKUP.get(value) ?? value;
};

export const normalizeApplicationInfoEnumValues = (
	values: Array<string> | null | undefined
): Array<string> => (values ?? []).map((value) => normalizeApplicationInfoEnumValue(value));

export const translateApplicationInfoEnumValue = (
	value: string | null | undefined,
	t: (key: string) => string
): string => {
	if (!value) {
		return "-";
	}

	const normalizedValue = normalizeApplicationInfoEnumValue(value);
	const labelKey = LABEL_LOOKUP.get(normalizedValue);
	return labelKey ? t(labelKey) : normalizedValue;
};

export const translateApplicationInfoEnumValues = (
	values: Array<string> | null | undefined,
	t: (key: string) => string
): string => {
	if (!values || values.length === 0) {
		return "-";
	}

	return values
		.map((value) => translateApplicationInfoEnumValue(value, t))
		.join(", ");
};