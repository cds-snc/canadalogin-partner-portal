import { z } from "zod";
import type { ApplicationEnvironmentCreate } from "@/fetch/application-environments";

export const SIGNING_ALGORITHMS = [
	"RS256",
	"RS384",
	"RS512",
	"PS256",
	"PS384",
	"PS512",
	"ES256",
	"ES384",
	"ES512",
] as const;
export const ENCRYPTION_KEY_ALGORITHMS = ["RSA-OAEP", "RSA-OAEP-256"] as const;
export const ENCRYPTION_CONTENT_ALGORITHMS = [
	"A128GCM",
	"A192GCM",
	"A256GCM",
] as const;

const urlSchema = z.string().url();
const optionalUrlSchema = urlSchema.or(z.literal(""));
const ipAddressSchema = z.string().refine((value) => {
	if (value.includes(":")) {
		try {
			new URL(`http://[${value}]`);
			return true;
		} catch {
			return false;
		}
	}

	const octets = value.split(".");
	return (
		octets.length === 4 &&
		octets.every(
			(octet) =>
				/^\d{1,3}$/.test(octet) &&
				Number(octet) >= 0 &&
				Number(octet) <= 255
		)
	);
});
const algorithmSchema = z.enum(SIGNING_ALGORITHMS);
const encryptionKeySchema = z.enum(ENCRYPTION_KEY_ALGORITHMS);
const encryptionContentSchema = z.enum(ENCRYPTION_CONTENT_ALGORITHMS);
const tenantCodeSchema = z.enum(["test", "staging", "production"]);
const clientTypeSchema = z.enum(["public", "confidential"]);

export const environmentNameSchema = z
	.string()
	.min(1)
	.max(64)
	.regex(/^[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?$/);

export const isEnvironmentNameWithinLimit = (
	environmentName: string,
	tenantCode: string
): boolean => environmentName.length + tenantCode.length + 1 <= 64;

export const applicationEnvironmentSchema = z
	.object({
		applicationUrlEn: urlSchema,
		applicationUrlFr: urlSchema,
		outboundIps: z.array(ipAddressSchema).min(1).optional(),
		canDecryptMessages: z.boolean().nullable(),
		canEncryptRequests: z.boolean().nullable(),
		canSignMessages: z.boolean().nullable(),
		clientAuthMethod: z
			.enum(["private_key_jwt", "client_secret_basic", "client_secret_post"])
			.optional(),
		clientType: clientTypeSchema.nullable(),
		copyExisting: z.boolean().nullable(),
		decryptionContentAlgorithms: z.array(encryptionContentSchema),
		decryptionKeyAlgorithms: z.array(encryptionKeySchema),
		decryptionMessages: z.array(
			z.enum(["token_endpoint_response", "id_token", "userinfo"])
		),
		encryptionContentAlgorithms: z.array(encryptionContentSchema),
		encryptionKeyAlgorithms: z.array(encryptionKeySchema),
		environmentName: environmentNameSchema,
		jwksUri: optionalUrlSchema,
		logoutMethod: z.enum(["front_channel", "back_channel"]).optional(),
		pkceSupported: z.boolean().nullable(),
		postLogoutRedirectUris: z.array(urlSchema).min(1),
		redirectUris: z.array(urlSchema).min(1),
		signOutRequestUrl: optionalUrlSchema,
		signingMessages: z.array(z.enum(["request_object", "token_endpoint"])),
		signingSignatureAlgorithms: z.array(algorithmSchema),
		singleSignOut: z.boolean().nullable(),
		sourceEnvironmentUuid: z.string().optional(),
		tenantCode: tenantCodeSchema.or(z.literal("")),
		verificationMessages: z.array(z.enum(["id_token", "userinfo"])).min(1),
		verificationSignatureAlgorithms: z.array(algorithmSchema).min(1),
	})
	.superRefine((values, context) => {
		if (
			values.tenantCode &&
			!isEnvironmentNameWithinLimit(values.environmentName, values.tenantCode)
		) {
			context.addIssue({
				code: "custom",
				message: "environmentName",
				path: ["environmentName"],
			});
		}
		if (values.tenantCode === "") {
			context.addIssue({
				code: "custom",
				message: "tenantCode",
				path: ["tenantCode"],
			});
		}
		if (values.copyExisting && !values.sourceEnvironmentUuid) {
			context.addIssue({
				code: "custom",
				message: "sourceEnvironmentUuid",
				path: ["sourceEnvironmentUuid"],
			});
		}
		if (values.clientType === null) {
			context.addIssue({
				code: "custom",
				message: "clientType",
				path: ["clientType"],
			});
		}
		if (values.pkceSupported === null) {
			context.addIssue({
				code: "custom",
				message: "pkceSupported",
				path: ["pkceSupported"],
			});
		}
		if (values.singleSignOut === null) {
			context.addIssue({
				code: "custom",
				message: "singleSignOut",
				path: ["singleSignOut"],
			});
		}
		if (values.tenantCode === "staging" && values.singleSignOut !== true) {
			context.addIssue({
				code: "custom",
				message: "singleSignOut",
				path: ["singleSignOut"],
			});
		}
		if (values.canSignMessages === null) {
			context.addIssue({
				code: "custom",
				message: "canSignMessages",
				path: ["canSignMessages"],
			});
		}
		if (values.canEncryptRequests === null) {
			context.addIssue({
				code: "custom",
				message: "canEncryptRequests",
				path: ["canEncryptRequests"],
			});
		}
		if (values.canDecryptMessages === null) {
			context.addIssue({
				code: "custom",
				message: "canDecryptMessages",
				path: ["canDecryptMessages"],
			});
		}
		const singleSignOutEnabled =
			values.tenantCode === "staging" || values.singleSignOut === true;
		if (singleSignOutEnabled && !values.logoutMethod) {
			context.addIssue({
				code: "custom",
				message: "logoutMethod",
				path: ["logoutMethod"],
			});
		}
		if (singleSignOutEnabled && !values.signOutRequestUrl) {
			context.addIssue({
				code: "custom",
				message: "signOutRequestUrl",
				path: ["signOutRequestUrl"],
			});
		}
		if (values.clientType === "public" && values.pkceSupported === false) {
			context.addIssue({
				code: "custom",
				message: "pkceSupported",
				path: ["pkceSupported"],
			});
		}
		if (values.clientType === "confidential" && !values.clientAuthMethod) {
			context.addIssue({
				code: "custom",
				message: "clientAuthMethod",
				path: ["clientAuthMethod"],
			});
		}
		if (values.clientAuthMethod === "private_key_jwt" && !values.jwksUri) {
			context.addIssue({
				code: "custom",
				message: "jwksUri",
				path: ["jwksUri"],
			});
		}
		const conditionalLists = [
			[values.canSignMessages, values.signingMessages],
			[values.canSignMessages, values.signingSignatureAlgorithms],
			[values.canEncryptRequests, values.encryptionKeyAlgorithms],
			[values.canEncryptRequests, values.encryptionContentAlgorithms],
			[values.canDecryptMessages, values.decryptionMessages],
			[values.canDecryptMessages, values.decryptionKeyAlgorithms],
			[values.canDecryptMessages, values.decryptionContentAlgorithms],
		] as const;
		const conditionalFields = [
			"signingMessages",
			"signingSignatureAlgorithms",
			"encryptionKeyAlgorithms",
			"encryptionContentAlgorithms",
			"decryptionMessages",
			"decryptionKeyAlgorithms",
			"decryptionContentAlgorithms",
		] as const;
		conditionalLists.forEach(([enabled, list], index) => {
			const fieldName = conditionalFields[index];
			if (enabled && list.length === 0 && fieldName) {
				context.addIssue({
					code: "custom",
					message: "conditionalList",
					path: [fieldName],
				});
			}
		});
	});

export type ApplicationEnvironmentFormValues = z.infer<
	typeof applicationEnvironmentSchema
>;

export const stripEnvironmentTypePrefix = (environmentName: string): string =>
	environmentName.replace(/^(?:TEST|STAGING|PRODUCTION)-/, "");

export const DEFAULT_VALUES: ApplicationEnvironmentFormValues = {
	applicationUrlEn: "",
	applicationUrlFr: "",
	canDecryptMessages: null,
	canEncryptRequests: null,
	canSignMessages: null,
	clientType: null,
	copyExisting: null,
	decryptionContentAlgorithms: [],
	decryptionKeyAlgorithms: [],
	decryptionMessages: [],
	encryptionContentAlgorithms: [],
	encryptionKeyAlgorithms: [],
	environmentName: "",
	jwksUri: "",
	pkceSupported: null,
	postLogoutRedirectUris: [""],
	redirectUris: [""],
	signOutRequestUrl: "",
	signingMessages: [],
	signingSignatureAlgorithms: [],
	singleSignOut: null,
	sourceEnvironmentUuid: "",
	tenantCode: "",
	verificationMessages: ["id_token"],
	verificationSignatureAlgorithms: ["RS256"],
};

const optional = <T>(value: T | ""): T | undefined =>
	value === "" ? undefined : value;

export const toPayload = (
	values: ApplicationEnvironmentFormValues
): ApplicationEnvironmentCreate => {
	const { outboundIps, ...payloadValues } = values;
	void outboundIps;
	const singleSignOut =
		values.tenantCode === "staging" || values.singleSignOut === true;

	return {
		...payloadValues,
		canDecryptMessages: values.canDecryptMessages ?? false,
		canEncryptRequests: values.canEncryptRequests ?? false,
		canSignMessages: values.canSignMessages ?? false,
		clientType: values.clientType ?? "confidential",
		copyExisting: values.copyExisting ?? false,
		singleSignOut,
		tenantCode: tenantCodeSchema.parse(values.tenantCode),
		clientAuthMethod:
			values.clientType === "confidential"
				? optional(values.clientAuthMethod ?? "")
				: undefined,
		decryptionContentAlgorithms: values.canDecryptMessages
			? values.decryptionContentAlgorithms
			: [],
		decryptionKeyAlgorithms: values.canDecryptMessages
			? values.decryptionKeyAlgorithms
			: [],
		decryptionMessages: values.canDecryptMessages
			? values.decryptionMessages
			: [],
		encryptionContentAlgorithms: values.canEncryptRequests
			? values.encryptionContentAlgorithms
			: [],
		encryptionKeyAlgorithms: values.canEncryptRequests
			? values.encryptionKeyAlgorithms
			: [],
		jwksUri:
			values.clientType === "confidential" &&
			values.clientAuthMethod === "private_key_jwt"
				? optional(values.jwksUri)
				: undefined,
		logoutMethod: singleSignOut ? values.logoutMethod : undefined,
		pkceSupported:
			values.clientType === "public" ? true : (values.pkceSupported ?? false),
		signOutRequestUrl: singleSignOut
			? optional(values.signOutRequestUrl)
			: undefined,
		signingMessages: values.canSignMessages ? values.signingMessages : [],
		signingSignatureAlgorithms: values.canSignMessages
			? values.signingSignatureAlgorithms
			: [],
		sourceEnvironmentUuid: values.copyExisting
			? optional(values.sourceEnvironmentUuid ?? "")
			: undefined,
		environmentName: `${values.tenantCode.toUpperCase()}-${values.environmentName}`,
	};
};
