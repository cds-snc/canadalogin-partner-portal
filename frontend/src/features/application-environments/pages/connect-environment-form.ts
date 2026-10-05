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
const algorithmSchema = z.enum(SIGNING_ALGORITHMS);
const encryptionKeySchema = z.enum(ENCRYPTION_KEY_ALGORITHMS);
const encryptionContentSchema = z.enum(ENCRYPTION_CONTENT_ALGORITHMS);
const tenantCodeSchema = z.enum(["test", "staging"]);

export const applicationEnvironmentSchema = z
	.object({
		applicationUrlEn: urlSchema,
		applicationUrlFr: urlSchema,
		canDecryptMessages: z.boolean(),
		canEncryptRequests: z.boolean(),
		canSignMessages: z.boolean(),
		clientAuthMethod: z
			.enum(["private_key_jwt", "client_secret_basic", "client_secret_post"])
			.optional(),
		clientType: z.enum(["public", "confidential"]),
		copyExisting: z.boolean(),
		decryptionContentAlgorithms: z.array(encryptionContentSchema),
		decryptionKeyAlgorithms: z.array(encryptionKeySchema),
		decryptionMessages: z.array(
			z.enum(["token_endpoint_response", "id_token", "userinfo"])
		),
		encryptionContentAlgorithms: z.array(encryptionContentSchema),
		encryptionKeyAlgorithms: z.array(encryptionKeySchema),
		environmentName: z
			.string()
			.min(1)
			.max(64)
			.regex(/^[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?$/),
		jwksUri: optionalUrlSchema,
		logoutMethod: z.enum(["front_channel", "back_channel"]).optional(),
		pkceSupported: z.boolean(),
		postLogoutRedirectUris: z.array(urlSchema).min(1),
		redirectUris: z.array(urlSchema).min(1),
		sectorIdentifierUrl: optionalUrlSchema,
		sharesIdentifier: z.boolean(),
		signOutRequestUrl: optionalUrlSchema,
		signingMessages: z.array(z.enum(["request_object", "token_endpoint"])),
		signingSignatureAlgorithms: z.array(algorithmSchema),
		singleSignOut: z.boolean(),
		sourceEnvironmentUuid: z.string().optional(),
		tenantCode: tenantCodeSchema.or(z.literal("")),
		verificationMessages: z.array(z.enum(["id_token", "userinfo"])).min(1),
		verificationSignatureAlgorithms: z.array(algorithmSchema).min(1),
	})
	.superRefine((values, context) => {
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
		if (values.singleSignOut && !values.logoutMethod) {
			context.addIssue({
				code: "custom",
				message: "logoutMethod",
				path: ["logoutMethod"],
			});
		}
		if (values.singleSignOut && !values.signOutRequestUrl) {
			context.addIssue({
				code: "custom",
				message: "signOutRequestUrl",
				path: ["signOutRequestUrl"],
			});
		}
		if (values.clientType === "public" && !values.pkceSupported) {
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
		if (values.sharesIdentifier && !values.sectorIdentifierUrl) {
			context.addIssue({
				code: "custom",
				message: "sectorIdentifierUrl",
				path: ["sectorIdentifierUrl"],
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

export const DEFAULT_VALUES: ApplicationEnvironmentFormValues = {
	applicationUrlEn: "",
	applicationUrlFr: "",
	canDecryptMessages: false,
	canEncryptRequests: false,
	canSignMessages: false,
	clientType: "confidential",
	copyExisting: false,
	decryptionContentAlgorithms: [],
	decryptionKeyAlgorithms: [],
	decryptionMessages: [],
	encryptionContentAlgorithms: [],
	encryptionKeyAlgorithms: [],
	environmentName: "",
	jwksUri: "",
	pkceSupported: true,
	postLogoutRedirectUris: [""],
	redirectUris: [""],
	sectorIdentifierUrl: "",
	sharesIdentifier: false,
	signOutRequestUrl: "",
	signingMessages: [],
	signingSignatureAlgorithms: [],
	singleSignOut: false,
	sourceEnvironmentUuid: "",
	tenantCode: "",
	verificationMessages: ["id_token"],
	verificationSignatureAlgorithms: ["RS256"],
};

const optional = <T>(value: T | ""): T | undefined =>
	value === "" ? undefined : value;

export const toPayload = (
	values: ApplicationEnvironmentFormValues
): ApplicationEnvironmentCreate => ({
	...values,
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
	logoutMethod: values.singleSignOut ? values.logoutMethod : undefined,
	pkceSupported: values.clientType === "public" ? true : values.pkceSupported,
	sectorIdentifierUrl: values.sharesIdentifier
		? optional(values.sectorIdentifierUrl)
		: undefined,
	signOutRequestUrl: values.singleSignOut
		? optional(values.signOutRequestUrl)
		: undefined,
	signingMessages: values.canSignMessages ? values.signingMessages : [],
	signingSignatureAlgorithms: values.canSignMessages
		? values.signingSignatureAlgorithms
		: [],
	sourceEnvironmentUuid: values.copyExisting
		? optional(values.sourceEnvironmentUuid ?? "")
		: undefined,
});
