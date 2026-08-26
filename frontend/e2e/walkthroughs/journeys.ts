import { expect } from "@playwright/test";
import type {
	PageExpectation,
	PersonaDefinition,
	PersonaSlug,
	WalkthroughRecorder,
} from "./recorder";
import { WALKTHROUGH_PAGE_HOLD_MS } from "./settings";

export const PERSONAS = [
	{
		displayName: "CL Admin",
		fixtureId: "local-cl-admin",
		slug: "cl-admin",
	},
	{
		displayName: "RP Admin",
		fixtureId: "local-rp-admin",
		slug: "rp-admin",
	},
	{
		displayName: "RP User (Edit)",
		fixtureId: "local-rp-user-edit",
		slug: "rp-user-edit",
	},
	{
		displayName: "Read Only",
		fixtureId: "local-read-only",
		slug: "read-only",
	},
	{
		displayName: "No access",
		fixtureId: "local-no-access",
		slug: "no-access",
	},
] as const satisfies ReadonlyArray<PersonaDefinition>;

const SEEDED_WORKSPACE_NAME = "Local Partner Workspace Alpha";
const SEEDED_APPLICATION_NAME = "Alpha benefits finder";
const MAU_FIXTURE_START_DATE = "2026-08-18";
const MAU_FIXTURE_END_DATE = "2026-08-24";
const SEEDED_CONFIGURATIONS = [
	{
		displayName: "Test - completed registration",
		kind: "reference",
		label: "Test RP configuration — completed registration",
	},
	{
		displayName: "Test - draft endpoints",
		kind: "draft",
		label: "Test RP configuration — draft registration",
	},
	{
		displayName: "Staging - partner acceptance",
		kind: "staging",
		label: "Staging RP configuration",
	},
	{
		displayName: "Production - review pending",
		kind: "production",
		label: "Production RP configuration — review pending",
	},
] as const;

const escapeRegularExpression = (value: string): string =>
	value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");

const pageExpectation = (
	heading: PageExpectation["heading"],
	content?: PageExpectation["content"]
): PageExpectation => ({
	heading,
	...(content === undefined ? {} : { content }),
});

const isSingleSegmentChild = (
	parentPath: string,
	candidatePath: string
): boolean => {
	if (!candidatePath.startsWith(`${parentPath}/`)) {
		return false;
	}

	return !candidatePath.slice(parentPath.length + 1).includes("/");
};

const isRecordChild = (parentPath: string, candidatePath: string): boolean =>
	isSingleSegmentChild(parentPath, candidatePath) &&
	candidatePath !== `${parentPath}/new`;

const selectPersona = async (
	recorder: WalkthroughRecorder,
	persona: PersonaDefinition
): Promise<void> => {
	await recorder.page.goto("/", { waitUntil: "domcontentloaded" });
	// The GCDS wrapper and its shadow-root native select share an id. Resolve the
	// actual form control by its accessible name to avoid a strict-mode match on
	// both elements.
	const select = recorder.page.getByRole("combobox", {
		name: "Simulated persona",
	});
	await expect(select).toBeVisible();
	await recorder.capture(
		"Local persona selector",
		"persona-selector",
		pageExpectation(
			"CanadaLogin Partner Portal",
			"Try a simulated local persona"
		)
	);

	await select.hover();
	await select.click();
	await select.selectOption(persona.fixtureId);
	await expect(select).toHaveValue(persona.fixtureId);
	await recorder.page.waitForTimeout(
		WALKTHROUGH_PAGE_HOLD_MS < 1000 ? 25 : 900
	);

	await recorder.follow(
		recorder.page.getByRole("button", {
			name: "Continue as simulated user",
		}),
		persona.slug === "no-access" ? "Access denied" : "Authenticated home",
		(path) =>
			persona.slug === "no-access" ? path === "/access-denied" : path === "/",
		persona.slug === "no-access"
			? {
					allowAccessDenied: true,
					content: "You do not have access to this site",
					heading: "Access denied",
				}
			: pageExpectation("CanadaLogin Partner Portal", "Choose a task area.")
	);
};

const demonstrateLanguageSwitch = async (
	recorder: WalkthroughRecorder
): Promise<void> => {
	const frenchToggle = recorder.page
		.getByRole("link", { name: /Fran[cç]ais/iu })
		.first();
	await expect(frenchToggle).toBeVisible();
	await frenchToggle.hover();
	await recorder.page.waitForTimeout(
		WALKTHROUGH_PAGE_HOLD_MS < 1000 ? 25 : 450
	);
	await frenchToggle.click();
	await expect(recorder.page.locator("html")).toHaveAttribute("lang", /^fr/iu);
	await recorder.capture(
		"Authenticated home — French language switch",
		"click",
		pageExpectation(/CanadaLogin/iu)
	);

	const englishToggle = recorder.page
		.getByRole("link", { name: /English/iu })
		.first();
	await expect(englishToggle).toBeVisible();
	await englishToggle.hover();
	await englishToggle.click();
	await expect(recorder.page.locator("html")).toHaveAttribute("lang", /^en/iu);
};

type ApplicationJourneyOptions = {
	canEditApplication: boolean;
	includeConfigurations: boolean;
};

const recordApplicationPages = async (
	recorder: WalkthroughRecorder,
	applicationPath: string,
	options: ApplicationJourneyOptions
): Promise<void> => {
	await recorder.openPath(
		`${applicationPath}/details`,
		"Application details",
		pageExpectation(`Application details - ${SEEDED_APPLICATION_NAME}`)
	);
	if (options.canEditApplication) {
		await recorder.openPath(
			`${applicationPath}/details/edit`,
			"Edit application information",
			pageExpectation(
				`Edit application information - ${SEEDED_APPLICATION_NAME}`
			)
		);
	}

	await recorder.openPath(
		`${applicationPath}/checklist-and-evidence`,
		"Checklist and CATS evidence",
		pageExpectation("Checklist and evidence", SEEDED_APPLICATION_NAME)
	);

	if (options.includeConfigurations) {
		await recorder.openPath(
			`${applicationPath}/contacts`,
			"Application contacts",
			pageExpectation(`Application contacts - ${SEEDED_APPLICATION_NAME}`)
		);
		const contactEditPaths = await recorder.collectVisibleLinkPaths(
			(path) =>
				path.startsWith(`${applicationPath}/contacts/`) &&
				path.endsWith("/edit")
		);
		if (options.canEditApplication) {
			await recorder.openPath(
				`${applicationPath}/contacts/new`,
				"Create application contact",
				pageExpectation("Create application contact")
			);
			if (contactEditPaths[0]) {
				await recorder.openPath(
					contactEditPaths[0],
					"Edit application contact",
					pageExpectation(/^Edit application contact - .+/u)
				);
			} else {
				recorder.skip(
					"Edit application contact",
					"No seeded contact edit link was available from the contacts page."
				);
			}
		}
	}
};

type ConfigurationJourneyOptions = {
	canEdit: boolean;
};

const recordConfigurationPages = async (
	recorder: WalkthroughRecorder,
	applicationPath: string,
	options: ConfigurationJourneyOptions
): Promise<void> => {
	const listPath = `${applicationPath}/rp-configurations`;
	await recorder.openPath(
		listPath,
		"RP configurations",
		pageExpectation(`RP configurations - ${SEEDED_APPLICATION_NAME}`)
	);
	const configurations = await Promise.all(
		SEEDED_CONFIGURATIONS.map(async (configuration) => {
			const action = recorder.page.getByRole("link", {
				name: new RegExp(
					`^View RP configuration\\s+for\\s+${escapeRegularExpression(configuration.displayName)}$`,
					"iu"
				),
			});
			return {
				...configuration,
				path: await recorder.getInternalLinkPath(action),
			};
		})
	);

	if (options.canEdit) {
		await recorder.openPath(
			`${listPath}/new`,
			"Create RP configuration",
			pageExpectation("Create RP configuration")
		);
	}

	for (const configuration of configurations) {
		const configurationPath = configuration.path;
		await recorder.openPath(
			configurationPath,
			configuration.label,
			pageExpectation(configuration.displayName)
		);
		const taskPaths = await recorder.collectVisibleLinkPaths((path) =>
			path.startsWith(`${configurationPath}/`)
		);

		if (configuration.kind === "reference") {
			const configurationPage = taskPaths.find((path) =>
				path.endsWith("/configuration")
			);
			if (!configurationPage) {
				throw new Error(
					"The completed seeded RP configuration did not expose its saved configuration page."
				);
			}
			await recorder.openPath(
				configurationPage,
				"Saved RP configuration",
				pageExpectation(
					`Configuration - ${configuration.displayName}`,
					SEEDED_APPLICATION_NAME
				)
			);

			if (options.canEdit) {
				for (const [suffix, label] of [
					["/partner-environment/edit", "Edit Partner environment"],
					["/copy", "Copy RP configuration"],
					["/settings", "RP configuration settings"],
				] as const) {
					const taskPath = taskPaths.find((path) => path.endsWith(suffix));
					if (!taskPath) {
						throw new Error(
							`The seeded RP configuration did not expose the expected ${label} link.`
						);
					}
					const expectedHeading = {
						"/copy": "Copy configuration",
						"/partner-environment/edit": "Edit Partner environment",
						"/settings": `Settings - ${configuration.displayName}`,
					}[suffix];
					await recorder.openPath(
						taskPath,
						label,
						pageExpectation(expectedHeading)
					);
				}
			}
		}

		if (configuration.kind === "draft" && options.canEdit) {
			const resumeStep = taskPaths.find((path) =>
				path.includes("/registration/")
			);
			if (!resumeStep) {
				throw new Error(
					"The seeded draft RP configuration did not expose its registration questionnaire."
				);
			}
			await recorder.openPath(
				resumeStep,
				"Registration questionnaire",
				pageExpectation(/^Register RP application - .+/u)
			);
		}

		if (configuration.kind === "production") {
			const productionReviewPage = taskPaths.find((path) =>
				path.endsWith("/production-review")
			);
			if (!productionReviewPage) {
				throw new Error(
					"The seeded Production RP configuration did not expose Production review."
				);
			}
			await recorder.openPath(
				productionReviewPage,
				"Production review",
				pageExpectation("Production review", configuration.displayName)
			);
		}
	}

	recorder.skip(
		"Manage credentials",
		"The screen depends on IBM Security Verify and may expose secret material; it is deliberately not recorded."
	);
};

type WorkspaceJourneyOptions = ApplicationJourneyOptions & {
	canCreateWorkspace: boolean;
	canEditConfigurations: boolean;
	includeWorkspaceAccess: boolean;
	includeWorkspaceSettings: boolean;
};

const recordWorkspaceAccessPages = async (
	recorder: WalkthroughRecorder,
	workspacePath: string
): Promise<void> => {
	const accessPath = `${workspacePath}/access`;
	await recorder.openPath(
		accessPath,
		"Workspace access",
		pageExpectation(`Access — ${SEEDED_WORKSPACE_NAME}`)
	);

	const assignmentsPath = `${accessPath}/assignments`;
	await recorder.openPath(
		assignmentsPath,
		"Current role assignments",
		pageExpectation("Current role assignments", SEEDED_WORKSPACE_NAME)
	);
	const assignmentPaths = await recorder.collectVisibleLinkPaths((path) =>
		isRecordChild(assignmentsPath, path)
	);
	if (assignmentPaths[0]) {
		await recorder.openPath(
			assignmentPaths[0],
			"Role assignment details",
			pageExpectation(/^Access for .+/u)
		);
	}
	await recorder.openPath(
		`${assignmentsPath}/new`,
		"Add existing user",
		pageExpectation("Add an existing user")
	);

	const invitationsPath = `${accessPath}/invitations`;
	await recorder.openPath(
		invitationsPath,
		"Workspace invitations",
		pageExpectation("Workspace invitations")
	);
	const invitationPaths = (
		await recorder.collectVisibleLinkPaths((path) =>
			isRecordChild(invitationsPath, path)
		)
	).slice(0, 2);
	for (const [index, invitationPath] of invitationPaths.entries()) {
		await recorder.openPath(
			invitationPath,
			`Workspace invitation ${index + 1}`,
			pageExpectation(/^Invitation for .+@local\.example$/u)
		);
	}
	await recorder.openPath(
		`${invitationsPath}/new`,
		"Invite partner user",
		pageExpectation("Invite a user to this workspace")
	);
};

const recordWorkspaceJourney = async (
	recorder: WalkthroughRecorder,
	options: WorkspaceJourneyOptions
): Promise<void> => {
	await recorder.openPath(
		"/workspaces",
		"Partner workspaces",
		pageExpectation("Workspaces", SEEDED_WORKSPACE_NAME)
	);
	const workspaceAction = recorder.page.getByRole("button", {
		name: new RegExp(
			`^View workspace\\s+${escapeRegularExpression(SEEDED_WORKSPACE_NAME)}$`,
			"iu"
		),
	});
	const workspacePath = await recorder.follow(
		workspaceAction,
		"Workspace task hub",
		(path) => /^\/workspaces\/[^/]+$/u.test(path),
		pageExpectation(SEEDED_WORKSPACE_NAME)
	);

	const applicationsPath = `${workspacePath}/applications`;
	await recorder.openPath(
		applicationsPath,
		"Applications",
		pageExpectation(`Application information - ${SEEDED_WORKSPACE_NAME}`)
	);
	const applicationAction = recorder.page.getByRole("button", {
		name: new RegExp(
			`^View application\\s+${escapeRegularExpression(SEEDED_APPLICATION_NAME)}$`,
			"iu"
		),
	});
	const applicationPath = await recorder.follow(
		applicationAction,
		"Application task hub",
		(path) => isSingleSegmentChild(applicationsPath, path),
		pageExpectation(SEEDED_APPLICATION_NAME)
	);

	await recordApplicationPages(recorder, applicationPath, options);
	if (options.canEditApplication) {
		await recorder.openPath(
			`${applicationsPath}/new`,
			"Create application information",
			pageExpectation("Create application information")
		);
	}
	if (options.includeConfigurations) {
		await recordConfigurationPages(recorder, applicationPath, {
			canEdit: options.canEditConfigurations,
		});
	}
	if (options.includeWorkspaceAccess) {
		await recordWorkspaceAccessPages(recorder, workspacePath);
	}
	if (options.includeWorkspaceSettings) {
		await recorder.openPath(
			`${workspacePath}/settings`,
			"Workspace settings",
			pageExpectation(`Workspace settings - ${SEEDED_WORKSPACE_NAME}`)
		);
	}
	if (options.canCreateWorkspace) {
		await recorder.openPath(
			"/workspaces/new",
			"Create partner workspace",
			pageExpectation("Create workspace")
		);
	}
};

const setDateInput = async (
	recorder: WalkthroughRecorder,
	legend: string,
	isoDate: string
): Promise<void> => {
	const [year, month, day] = isoDate.split("-");
	if (!year || !month || !day) {
		throw new Error(`Invalid walkthrough fixture date: ${isoDate}`);
	}

	const group = recorder.page.getByRole("group", { name: legend });
	await expect(group).toBeVisible();
	const dayInput = group.getByRole("textbox", { name: "Day" });
	const monthInput = group.getByRole("combobox", { name: "Month" });
	const yearInput = group.getByRole("textbox", { name: "Year" });
	await dayInput.fill(String(Number(day)));
	await monthInput.selectOption(month);
	await yearInput.fill(year);
	await expect(dayInput).toHaveValue(String(Number(day)));
	await expect(monthInput).toHaveValue(month);
	await expect(yearInput).toHaveValue(year);
};

const recordReportsJourney = async (
	recorder: WalkthroughRecorder
): Promise<void> => {
	await recorder.openPath("/reports", "Reports", pageExpectation("Reports"));
	await recorder.openPath(
		"/reports/applications",
		"RP configuration usage reports",
		pageExpectation("RP configuration usage reports", SEEDED_WORKSPACE_NAME)
	);
	const reportCard = recorder.page
		.getByRole("listitem")
		.filter({ hasText: SEEDED_WORKSPACE_NAME })
		.filter({ hasText: "Alpha integration" });
	const reportLink = reportCard.getByRole("link", {
		name: "Test - completed registration",
	});
	await recorder.navigate(reportLink, (path) => path.endsWith("/usage"));
	await setDateInput(recorder, "Start date", MAU_FIXTURE_START_DATE);
	await setDateInput(recorder, "End date", MAU_FIXTURE_END_DATE);
	const applyDateRange = recorder.page.getByRole("button", {
		name: "Apply date range",
	});
	await expect(applyDateRange).toBeVisible();
	await applyDateRange.hover();
	await applyDateRange.click();
	await recorder.capture(
		"Monthly active user report — fixed fixture week",
		"click",
		pageExpectation("Usage Report", "August 18, 2026 to August 24, 2026")
	);
};

const recordSelectedUserJourney = async (
	recorder: WalkthroughRecorder
): Promise<void> => {
	await recorder.openPath(
		"/users",
		"Users and access",
		pageExpectation("Users and access")
	);
	const userEmail = "local-rp-admin@local.example";
	const search = recorder.page.getByRole("searchbox", {
		name: "Search users",
	});
	await expect(search).toBeVisible();
	await search.hover();
	await search.click();
	await search.fill(userEmail);
	const userAction = recorder.page.getByRole("button", {
		name: new RegExp(`^Manage\\s+${escapeRegularExpression(userEmail)}$`, "iu"),
	});
	await expect(userAction).toBeVisible();
	const selectedUserPath = await recorder.follow(
		userAction,
		"Selected user",
		(path) => /^\/users\/[^/]+$/u.test(path),
		pageExpectation("Access for Local RP Admin", userEmail)
	);
	const taskPaths = await recorder.collectVisibleLinkPaths((path) =>
		path.startsWith(`${selectedUserPath}/`)
	);

	for (const [suffix, label] of [
		["/global-access", "Selected user global access"],
		["/workspace-access", "Selected user workspace access"],
		["/workspace-access/new", "Add selected user workspace access"],
		["/invitations", "Selected user pending invitations"],
	] as const) {
		const taskPath = taskPaths.find((path) => path.endsWith(suffix));
		if (taskPath) {
			const expectedHeading = {
				"/global-access": "Manage global access",
				"/invitations": "Pending invitations for this user",
				"/workspace-access": "Manage workspace access",
				"/workspace-access/new": "Add workspace access",
			}[suffix];
			await recorder.openPath(
				taskPath,
				label,
				pageExpectation(expectedHeading)
			);
		}
	}
};

const recordClAdminJourney = async (
	recorder: WalkthroughRecorder
): Promise<void> => {
	await demonstrateLanguageSwitch(recorder);
	await recorder.openPath(
		"/onboarding-oversight",
		"Onboarding oversight",
		pageExpectation("Onboarding oversight")
	);
	await recorder.openPath(
		"/onboarding-oversight/queue",
		"Production reviews",
		pageExpectation("Production reviews", "Production-review requests")
	);
	const productionReviewAction = recorder.page.getByRole("button", {
		name: new RegExp(
			"^View Production review\\s+Alpha benefits finder:\\s+Production - review pending$",
			"iu"
		),
	});
	await recorder.follow(
		productionReviewAction,
		"Production review details — pending Alpha fixture",
		(path) => path.endsWith("/production-review"),
		pageExpectation("Production review", "Production - review pending")
	);

	await recordWorkspaceJourney(recorder, {
		canCreateWorkspace: true,
		canEditApplication: false,
		canEditConfigurations: false,
		includeConfigurations: false,
		includeWorkspaceAccess: true,
		includeWorkspaceSettings: false,
	});
	await recorder.openPath(
		"/administration",
		"Administration",
		pageExpectation("Administration")
	);
	await recordSelectedUserJourney(recorder);
	await recorder.openPath(
		"/users/invite",
		"Invite a user",
		pageExpectation("Invite user")
	);
	await recorder.openPath(
		"/roles",
		"Canonical roles",
		pageExpectation("Roles")
	);
	await recorder.openPath("/support", "Support", pageExpectation("Support"));
	await recorder.openPath("/account", "Account", pageExpectation("Account"));
	recorder.skip(
		"Adopt existing RP registrations",
		"Retained-registration provider comparison is outside the local walkthrough integration boundary.",
		"/workspaces/rp-registration-adoption"
	);
};

const recordPartnerJourney = async (
	recorder: WalkthroughRecorder,
	slug: Extract<PersonaSlug, "read-only" | "rp-admin" | "rp-user-edit">
): Promise<void> => {
	const canEdit = slug !== "read-only";
	const isRpAdmin = slug === "rp-admin";
	await recordWorkspaceJourney(recorder, {
		canCreateWorkspace: false,
		canEditApplication: canEdit,
		canEditConfigurations: canEdit,
		includeConfigurations: true,
		includeWorkspaceAccess: isRpAdmin,
		includeWorkspaceSettings: isRpAdmin,
	});
	await recordReportsJourney(recorder);
	await recorder.openPath("/support", "Support", pageExpectation("Support"));
	await recorder.openPath("/account", "Account", pageExpectation("Account"));
};

export const recordPersonaJourney = async (
	recorder: WalkthroughRecorder,
	persona: PersonaDefinition
): Promise<void> => {
	await selectPersona(recorder, persona);

	switch (persona.slug) {
		case "cl-admin":
			await recordClAdminJourney(recorder);
			return;
		case "no-access":
			return;
		case "read-only":
		case "rp-admin":
		case "rp-user-edit":
			await recordPartnerJourney(recorder, persona.slug);
	}
};
