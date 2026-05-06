import type { PropsWithChildren, ReactElement } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApplicationInfoModal } from "@/features/workspaces/components/ApplicationInfoModal";
import {
	createWorkspaceApplicationInfo,
	type ApplicationInfoRead,
	updateWorkspaceApplicationInfo,
} from "@/fetch/application-info";
import type { IdentityProofingMethodValue } from "@/features/workspaces/application-info-options";

const successToast = vi.fn();
const errorToast = vi.fn();
const invalidateQueries = vi.fn(async () => undefined);

vi.mock("@tanstack/react-query", () => ({
	useQueryClient: (): { invalidateQueries: typeof invalidateQueries } => ({
		invalidateQueries,
	}),
}));

vi.mock("react-i18next", () => ({
	useTranslation: (): {
		t: (key: string) => string;
	} => ({
		t: (key: string): string => {
			const translations: Record<string, string> = {
				"common.cancel": "Cancel",
				"common.next": "Next",
				"common.previous": "Previous",
				"common.save": "Save",
				"common.saving": "Saving",
				"errors.unknown": "Something went wrong",
				"workspaces.appInfoAboutLabel": "About the application",
				"workspaces.appInfoApplicationDescriptionLabel": "Application description",
				"workspaces.appInfoApplicationNameLabel": "Application name",
				"workspaces.appInfoApplicationUrlLabel": "Application URL",
				"workspaces.appInfoAuthenticationProtocolLabel": "Authentication protocol",
				"workspaces.appInfoAuthorityLabel": "Authority to collect personal information",
				"workspaces.appInfoCalLabel": "Credential assurance level",
				"workspaces.appInfoCreatedSuccess": "Application information created",
				"workspaces.appInfoCreateModalTitle": "Create application information",
				"workspaces.appInfoCurrentMfaOptionsLabel": "Current MFA options",
				"workspaces.appInfoCurrentSignInOptionsLabel": "Current sign-in options",
				"workspaces.appInfoCurrentSignInOptionsOtherLabel": "Current sign-in options other",
				"workspaces.appInfoEditModalTitle": "Edit application information",
				"workspaces.appInfoMonthlyActiveUsersLabel": "Monthly active users",
				"workspaces.appInfoOrganizationLabel": "Organization",
				"workspaces.appInfoOtherLabel": "Other (Please specify)",
				"workspaces.appInfoPeakUsagePeriodsLabel": "Peak usage periods",
				"workspaces.appInfoPersonalInformationCollectedLabel": "Personal information collected",
				"workspaces.appInfoPersonalInformationOtherLabel": "Other personal information",
				"workspaces.appInfoPlannedOidcDateLabel": "Planned OIDC implementation date",
				"workspaces.appInfoPortalNameLabel": "Portal name",
				"workspaces.appInfoStepAbout": "About the application",
				"workspaces.appInfoStepSecurity": "Security",
				"workspaces.appInfoStepTechnology": "Technology",
				"workspaces.appInfoStepTransition": "For transitioning applications",
				"workspaces.appInfoStepUsage": "Usage",
				"workspaces.appInfoStepReview": "Review",
				"workspaces.appInfoTransitionMitigationsLabel": "Mitigations",
				"workspaces.appInfoTransitionRationaleLabel": "Rationale for using or not using",
				"workspaces.appInfoTransitionRisksLabel": "Risks to transition",
				"workspaces.appInfoUpdatedSuccess": "Application information updated",
				"workspaces.appInfoUsesCanadaloginMigrationLabel": "Will you be using the CanadaLogin migration solution?",
				"workspaces.appInfoUserTypeLabel": "User type",
				"workspaces.appInfoUserTypeOtherLabel": "Other user type",
				"workspaces.appInfoConsolidatorUsedLabel": "Consolidator used",
				"workspaces.appInfoScheduleBlackoutPeriodsLabel": "Maintenance blackout periods",
				"workspaces.appInfoHasAccessManagementLayerLabel": "Do you have an access management layer?",
				"workspaces.appInfoHasAccountRecoveryLabel": "Do you have an account recovery process?",
				"workspaces.appInfoHasPrivacyNoticeLabel": "Does your service have a privacy notice or terms and conditions?",
				"workspaces.appInfoIalLabel": "Identity assurance level",
				"workspaces.appInfoIdentityProofingLabel": "How does the application prove a user's identity?",
				"workspaces.appInfoIsCbasLabel": "Critical Business Application or Service (CBAS)",
				"workspaces.appInfoProgramLineOfBusinessLabel": "Program / Line of business",
				"workspaces.appInfoRequestsProfileDataPushesLabel": "Can the application receive asynchronous profile data pushes?",
				"workspaces.appInfoRollbackStrategyLabel": "What is your rollback strategy for production?",
				"workspaces.appInfoTechStackLabel": "Tech stack",
				"workspaces.appInfoTechnologyLabel": "Technology",
				"workspaces.optionAuthenticationProtocolBoth": "Both OIDC and SAML",
				"workspaces.optionAuthenticationProtocolNone": "None",
				"workspaces.optionConsolidatorEcas": "Enterprise Cyber Authentication Solution (ECAS)",
				"workspaces.optionConsolidatorGccfOidc": "GCCF Consolidator (OIDC)",
				"workspaces.optionConsolidatorGccfSaml": "GCCF GCKey & Interact sign in (SAML)",
				"workspaces.optionConsolidatorNone": "No consolidator",
				"workspaces.optionConsolidatorSigninCanada": "Signin Canada",
				"workspaces.optionIdentityProofingExternal": "External ID provider",
				"workspaces.optionIdentityProofingInPerson": "In-person ID provider",
				"workspaces.optionIdentityProofingNone": "It does not",
				"workspaces.optionIdentityProofingOther": "Other (Please specify)",
				"workspaces.optionMfaCustom": "Custom MFA built internally",
				"workspaces.optionMfaMfaas1": "MFAaaS 1.0 (SMS/voice or email, API)",
				"workspaces.optionMfaMfaas2": "MFAaaS 2.0 (auth app or email, GUI)",
				"workspaces.optionMfaMfaas3": "MFAaaS 3.0 (auth app, email, SMS/voice, part of GCKey)",
				"workspaces.optionMfaNone": "No MFA",
				"workspaces.optionPersonalInformationAddress": "Address (mailing or residential not specified)",
				"workspaces.optionPersonalInformationDateOfBirth": "Date of birth",
				"workspaces.optionPersonalInformationEmail": "Email address",
				"workspaces.optionPersonalInformationFirstName": "First name",
				"workspaces.optionPersonalInformationLastName": "Last name",
				"workspaces.optionSaml": "SAML",
				"workspaces.optionSignInAlberta": "Alberta.ca Account (provincial partner)",
				"workspaces.optionSignInBcServices": "BC Services Card (provincial partner)",
				"workspaces.optionSignInDepartmentCredential": "A credential specific to a department or service",
				"workspaces.optionSignInGcKey": "GCKey",
				"workspaces.optionSignInInteract": "Interac sign in",
				"workspaces.optionSignInOther": "Others (Please specify)",
				"workspaces.optionUserTypeBusinesses": "Organizations or businesses",
				"workspaces.optionUserTypeOfficials": "Official representatives for service users (e.g. lawyers, accountants, advocates)",
				"workspaces.optionUserTypePublic": "Members of the public",
				"workspaces.optionNo": "No",
				"workspaces.optionOidc": "OIDC",
				"workspaces.optionYes": "Yes",
			};

			return translations[key] ?? key;
		},
	}),
}));

vi.mock("@/components/ui/Toast", () => ({
	useToast: (): { error: typeof errorToast; success: typeof successToast } => ({
		error: errorToast,
		success: successToast,
	}),
}));

vi.mock("@/components/ui", () => ({
	Button: ({ children, disabled, onGcdsClick, type }: PropsWithChildren<{ disabled?: boolean; onGcdsClick?: () => void; type?: "button" | "submit" }>): ReactElement => (
		<button disabled={disabled} type={type ?? "button"} onClick={onGcdsClick}>
			{children}
		</button>
	),
	Checkboxes: ({ legend, name, onInput, options, value }: { legend?: string; name: string; onInput?: (event: { target: { name: string; value: string[] } }) => void; options: Array<{ id: string; label: string; value?: string }>; value?: string[] }): ReactElement => {
		const selectedValues = value ?? [];
		return (
			<fieldset>
				{legend ? <legend>{legend}</legend> : null}
				{options.map((option) => {
					const optionValue = option.value ?? option.label;
					return (
						<label htmlFor={option.id} key={option.id}>
							<span>{option.label}</span>
							<input
								checked={selectedValues.includes(optionValue)}
								id={option.id}
								name={name}
								type="checkbox"
								onChange={(event): void => {
									const nextValue = event.currentTarget.checked
										? [...selectedValues, optionValue]
										: selectedValues.filter((item) => item !== optionValue);
									onInput?.({ target: { name, value: nextValue } });
								}}
							/>
						</label>
					);
				})}
			</fieldset>
		);
	},
	Fieldset: ({ children, legend }: PropsWithChildren<{ legend: string }>): ReactElement => (
		<fieldset>
			<legend>{legend}</legend>
			{children}
		</fieldset>
	),
	Input: ({ inputId, label, name, onInput, value, type }: { inputId: string; label: string; name: string; onInput?: (event: { target: { value: string } }) => void; value?: string; type?: string }): ReactElement => (
		<label htmlFor={inputId}>
			<span>{label}</span>
			<input
				id={inputId}
				name={name}
				type={type}
				value={value}
				onInput={(event): void => onInput?.({ target: { value: (event.target as HTMLInputElement).value } })}
			/>
		</label>
	),
	Modal: ({ children, isOpen, title }: PropsWithChildren<{ isOpen: boolean; title: string }>): ReactElement | null =>
		isOpen ? (
			<section>
				<h2>{title}</h2>
				{children}
			</section>
		) : null,
	Select: ({ children, label, onInput, selectId, value }: PropsWithChildren<{ label: string; onInput?: (event: { target: { value: string } }) => void; selectId: string; value?: string }>): ReactElement => (
		<label htmlFor={selectId}>
			<span>{label}</span>
			<select id={selectId} value={value} onInput={(event): void => onInput?.({ target: { value: (event.target as HTMLSelectElement).value } })}>
				{children}
			</select>
		</label>
	),
	Textarea: ({ label, name, onInput, textareaId, value }: { label: string; name: string; onInput?: (event: { target: { value: string } }) => void; textareaId: string; value?: string }): ReactElement => (
		<label htmlFor={textareaId}>
			<span>{label}</span>
			<textarea
				id={textareaId}
				name={name}
				value={value}
				onInput={(event): void => onInput?.({ target: { value: (event.target as HTMLTextAreaElement).value } })}
			/>
		</label>
	),
	Stepper: ({ children }: PropsWithChildren): ReactElement => <div>{children}</div>,
}));

vi.mock("@/fetch/application-info", () => ({
	createWorkspaceApplicationInfo: vi.fn(),
	workspaceApplicationInfoQueryKey: (
		workspaceUuid: string
	): readonly [string, string] => ["workspace-application-info", workspaceUuid],
	updateWorkspaceApplicationInfo: vi.fn(),
}));

const buildApplicationInfo = (
	overrides: Partial<ApplicationInfoRead> = {}
): ApplicationInfoRead => ({
	aboutApplication: "Benefits service",
	applicationDescription: "Benefits access for citizens",
	applicationName: "Benefits Portal",
	applicationUrl: "https://benefits.example.gc.ca",
	authorityToCollectPersonalInformation: "Department act",
	authenticationProtocol: "OIDC",
	consolidatorUsed: "NONE",
	createdAt: "2026-04-08T00:00:00Z",
	createdBy: 1,
	credentialAssuranceLevel: "2",
	currentMfaOptions: "NONE",
	currentSignInOptions: [],
	hasAccessManagementLayer: true,
	hasAccountRecovery: true,
	hasPrivacyNotice: true,
	id: 1,
	identityAssuranceLevel: "2",
	identityProofingMethod: "EXTERNAL_ID_PROVIDER",
	isCbas: true,
	isDeleted: false,
	personalInformationCollected: [],
	programLineOfBusiness: "Benefits",
	requestsProfileDataPushes: false,
	rollbackStrategy: "Blue-green rollback",
	techStack: "FastAPI + React",
	technology: "Web portal",
	userTypes: [],
	usesCanadaloginMigration: false,
	uuid: "application-info-uuid-1",
	workspaceId: 10,
	...overrides,
});

describe("ApplicationInfoModal", () => {
	beforeEach(() => {
		successToast.mockReset();
		errorToast.mockReset();
		invalidateQueries.mockClear();
		vi.mocked(createWorkspaceApplicationInfo).mockReset();
		vi.mocked(updateWorkspaceApplicationInfo).mockReset();
	});

	it("does not crash when editing a partially populated application info record", () => {
		render(
			<ApplicationInfoModal
				applicationInfo={buildApplicationInfo({
					applicationDescription: undefined as unknown as string,
					authorityToCollectPersonalInformation:
						undefined as unknown as string,
					credentialAssuranceLevel: undefined as unknown as string,
					identityAssuranceLevel: undefined as unknown as string,
					identityProofingMethod:
						undefined as unknown as IdentityProofingMethodValue,
					programLineOfBusiness: undefined as unknown as string,
					rollbackStrategy: undefined as unknown as string,
					techStack: undefined as unknown as string,
					technology: undefined as unknown as string,
					uuid: "application-info-uuid-legacy",
				})}
				isOpen={true}
				mode="edit"
				organizationLabel="Health Canada"
				workspaceUuid="workspace-uuid-1"
				onClose={vi.fn()}
				onSaved={vi.fn(async () => undefined)}
			/>
		);

		expect(
			(screen.getByRole("button", { name: /^next$/i }) as HTMLButtonElement)
				.disabled
		).toBe(true);
	});

	it("creates workspace application information", async () => {
		vi.mocked(createWorkspaceApplicationInfo).mockResolvedValue(
			buildApplicationInfo()
		);
		const onClose = vi.fn();
		const onSaved = vi.fn(async () => undefined);

		render(
			<ApplicationInfoModal
				isOpen={true}
				organizationLabel="Health Canada"
				workspaceUuid="workspace-uuid-1"
				onClose={onClose}
				onSaved={onSaved}
			/>
		);

		expect(screen.getByRole("button", { name: /^next$/i })).toBeTruthy();
		expect(screen.queryByText(/^technology$/i)).toBeNull();

		fireEvent.input(screen.getByLabelText(/application name/i), {
			target: { value: "Benefits Portal" },
		});
		fireEvent.input(screen.getByLabelText(/about the application/i), {
			target: { value: "Benefits service" },
		});
		fireEvent.input(screen.getByLabelText(/program \/ line of business/i), {
			target: { value: "Benefits" },
		});
		fireEvent.input(screen.getByLabelText(/application url/i), {
			target: { value: "https://benefits.example.gc.ca" },
		});
		fireEvent.input(screen.getByLabelText(/^application description$/i), {
			target: { value: "Benefits access for citizens" },
		});
		fireEvent.input(screen.getByLabelText(/portal name/i), {
			target: { value: "Benefits Portal Suite" },
		});
		fireEvent.click(screen.getByRole("button", { name: /^next$/i }));
		fireEvent.input(screen.getByLabelText(/^technology$/i), {
			target: { value: "Web portal" },
		});
		fireEvent.input(screen.getByLabelText(/authentication protocol/i), {
			target: { value: "BOTH_OIDC_AND_SAML" },
		});
		fireEvent.input(screen.getByLabelText(/planned OIDC implementation date/i), {
			target: { value: "2026-06-01" },
		});
		fireEvent.input(screen.getByLabelText(/tech stack/i), {
			target: { value: "FastAPI + React" },
		});
		fireEvent.input(screen.getByLabelText(/access management layer/i), {
			target: { value: "true" },
		});
		fireEvent.input(screen.getByLabelText(/profile data pushes/i), {
			target: { value: "false" },
		});
		fireEvent.input(screen.getByLabelText(/rollback strategy/i), {
			target: { value: "Blue-green rollback" },
		});
		fireEvent.click(screen.getByRole("button", { name: /^next$/i }));
		fireEvent.input(screen.getByLabelText(/credential assurance level/i), {
			target: { value: "2" },
		});
		fireEvent.input(screen.getByLabelText(/identity assurance level/i), {
			target: { value: "2" },
		});
		fireEvent.input(screen.getByLabelText(/prove a user's identity/i), {
			target: { value: "OTHER" },
		});
		fireEvent.input(screen.getByLabelText(/^other \(please specify\)$/i), {
			target: { value: "Partner assertion" },
		});
		fireEvent.input(screen.getByLabelText(/critical business application/i), {
			target: { value: "true" },
		});
		fireEvent.input(screen.getByLabelText(/account recovery process/i), {
			target: { value: "true" },
		});
		fireEvent.input(screen.getByLabelText(/authority to collect personal information/i), {
			target: { value: "Department act" },
		});
		fireEvent.input(screen.getByLabelText(/privacy notice or terms and conditions/i), {
			target: { value: "true" },
		});
		fireEvent.click(screen.getByRole("button", { name: /^next$/i }));
		fireEvent.click(screen.getByLabelText(/members of the public/i));
		fireEvent.click(screen.getByLabelText(/organizations or businesses/i));
		fireEvent.input(screen.getByLabelText(/monthly active users/i), {
			target: { value: "12000" },
		});
		fireEvent.input(screen.getByLabelText(/peak usage periods/i), {
			target: { value: "Tax season" },
		});
		fireEvent.click(screen.getByLabelText(/^first name$/i));
		fireEvent.click(screen.getByLabelText(/^last name$/i));
		fireEvent.click(screen.getByLabelText(/email address/i));
		fireEvent.click(screen.getByRole("button", { name: /^next$/i }));
		fireEvent.click(screen.getByLabelText(/^GCKey$/i));
		fireEvent.click(screen.getByLabelText(/Interac sign in/i));
		fireEvent.input(screen.getByLabelText(/consolidator used/i), {
			target: { value: "SIGNIN_CANADA" },
		});
		fireEvent.input(screen.getByLabelText(/current MFA options/i), {
			target: {
				value: "MFAAS_3",
			},
		});
		fireEvent.input(screen.getByLabelText(/canadalogin migration solution/i), {
			target: { value: "true" },
		});
		fireEvent.input(screen.getByLabelText(/rationale for using or not using/i), {
			target: { value: "Required for migration" },
		});
		fireEvent.input(screen.getByLabelText(/maintenance blackout periods/i), {
			target: { value: "End of quarter freeze" },
		});
		fireEvent.input(screen.getByLabelText(/risks to transition/i), {
			target: { value: "Service interruption" },
		});
		fireEvent.input(screen.getByLabelText(/^mitigations$/i), {
			target: { value: "Phased rollout" },
		});
		expect(screen.queryByRole("button", { name: /^save$/i })).toBeNull();
		fireEvent.click(screen.getByRole("button", { name: /^next$/i }));
		expect(screen.getByText(/^review$/i)).toBeTruthy();
		expect(
			screen.getByRole("heading", { name: /^about the application$/i })
		).toBeTruthy();
		expect(screen.getByRole("heading", { name: /^technology$/i })).toBeTruthy();
		expect(screen.getByRole("heading", { name: /^security$/i })).toBeTruthy();
		expect(screen.getByRole("heading", { name: /^usage$/i })).toBeTruthy();
		expect(
			screen.getByRole("heading", {
				name: /for transitioning applications/i,
			})
		).toBeTruthy();
		expect(screen.getAllByText(/benefits portal/i).length).toBeGreaterThan(0);
		fireEvent.click(screen.getByRole("button", { name: /^save$/i }));

		await waitFor(() => {
			expect(createWorkspaceApplicationInfo).toHaveBeenCalledWith(
				"workspace-uuid-1",
				{
					aboutApplication: "Benefits service",
					applicationDescription: "Benefits access for citizens",
					applicationName: "Benefits Portal",
					applicationUrl: "https://benefits.example.gc.ca",
					authorityToCollectPersonalInformation: "Department act",
					authenticationProtocol: "BOTH_OIDC_AND_SAML",
					credentialAssuranceLevel: "2",
					currentMfaOptions: "MFAAS_3",
					currentSignInOptions: ["GC_KEY", "INTERAC_SIGN_IN"],
					hasAccessManagementLayer: true,
					hasAccountRecovery: true,
					hasPrivacyNotice: true,
					identityAssuranceLevel: "2",
					identityProofingMethod: "OTHER",
					identityProofingMethodOther: "Partner assertion",
					isCbas: true,
					migrationRationale: "Required for migration",
					monthlyActiveUsers: 12000,
					peakUsagePeriods: "Tax season",
					personalInformationCollected: [
						"FIRST_NAME",
						"LAST_NAME",
						"EMAIL_ADDRESS",
					],
					plannedOidcImplementationDate: "2026-06-01",
					portalName: "Benefits Portal Suite",
					programLineOfBusiness: "Benefits",
					requestsProfileDataPushes: false,
					rollbackStrategy: "Blue-green rollback",
					scheduleBlackoutPeriods: "End of quarter freeze",
					techStack: "FastAPI + React",
					technology: "Web portal",
					transitionMitigations: "Phased rollout",
					transitionRisks: "Service interruption",
					userTypes: ["PUBLIC", "ORGANIZATIONS_AND_BUSINESSES"],
					consolidatorUsed: "SIGNIN_CANADA",
					usesCanadaloginMigration: true,
				}
			);
		});
		await waitFor(() => {
			expect(successToast).toHaveBeenCalledWith("Application information created");
			expect(onClose).toHaveBeenCalled();
			expect(onSaved).toHaveBeenCalled();
		});
	});

	it("updates existing workspace application information", async () => {
		vi.mocked(updateWorkspaceApplicationInfo).mockResolvedValue(
			buildApplicationInfo({ applicationName: "Updated Benefits Portal" })
		);
		const onClose = vi.fn();
		const onSaved = vi.fn(async () => undefined);

		render(
			<ApplicationInfoModal
				applicationInfo={buildApplicationInfo({
					migrationRationale: null,
					monthlyActiveUsers: 100,
					peakUsagePeriods: null,
					plannedOidcImplementationDate: null,
					portalName: null,
					scheduleBlackoutPeriods: null,
					transitionMitigations: null,
					transitionRisks: null,
				})}
				isOpen={true}
				mode="edit"
				organizationLabel="Health Canada"
				workspaceUuid="workspace-uuid-1"
				onClose={onClose}
				onSaved={onSaved}
			/>
		);

		fireEvent.input(screen.getByLabelText(/application name/i), {
			target: { value: "Updated Benefits Portal" },
		});
		fireEvent.click(screen.getByRole("button", { name: /^next$/i }));
		fireEvent.click(screen.getByRole("button", { name: /^next$/i }));
		fireEvent.click(screen.getByRole("button", { name: /^next$/i }));
		fireEvent.click(screen.getByRole("button", { name: /^next$/i }));
		fireEvent.click(screen.getByRole("button", { name: /^next$/i }));
		fireEvent.click(screen.getByRole("button", { name: /^save$/i }));

		await waitFor(() => {
			expect(updateWorkspaceApplicationInfo).toHaveBeenCalledWith(
				"workspace-uuid-1",
				"application-info-uuid-1",
				expect.objectContaining({
					applicationName: "Updated Benefits Portal",
				})
			);
		});
		await waitFor(() => {
			expect(successToast).toHaveBeenCalledWith("Application information updated");
			expect(onClose).toHaveBeenCalled();
			expect(onSaved).toHaveBeenCalled();
		});
	});
});