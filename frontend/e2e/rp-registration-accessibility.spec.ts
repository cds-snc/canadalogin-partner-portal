import { expect, test } from "@playwright/test";

const summaryHeading = "L’inscription n’a pas pu être enregistrée";

test.beforeEach(async ({ page }) => {
	await page.goto("/e2e/fixtures/rp-registration-accessibility.html");
	await expect(page.getByRole("alert").first()).toBeVisible();
});

test("exposes real GCDS progress, available-step navigation, and focused errors", async ({
	page,
}) => {
	const navigation = page.getByRole("navigation", {
		name: "Étapes de l'inscription",
	});
	await expect(navigation.getByRole("listitem")).toHaveCount(6);
	await expect(navigation.getByRole("link")).toHaveCount(3);
	await expect(navigation.locator("[aria-current='step']")).toContainText(
		"Signature"
	);
	await expect(navigation).toContainText("À corriger avant la finalisation");

	const summary = page.locator("gcds-error-summary");
	await expect(summary).toHaveAttribute("heading", summaryHeading);
	await expect(summary.getByRole("link")).toHaveCount(3);
	await expect
		.poll(() =>
			summary.evaluate((host) =>
				Boolean(
					host.shadowRoot?.activeElement?.getAttribute("role") === "alert"
				)
			)
		)
		.toBe(true);
	const fixtureUrl = page.url();
	await navigation
		.getByRole("link", { name: "Renseignements de base" })
		.click();
	await expect(page).toHaveURL(fixtureUrl);
});

test("keeps inline messages associated and moves summary links to controls and groups", async ({
	page,
}) => {
	const inputHost = page.locator("gcds-input#registration-application-url");
	const inputState = await inputHost.evaluate((host) => {
		const input = host.shadowRoot?.querySelector("input");
		const describedIds = (input?.getAttribute("aria-describedby") ?? "")
			.trim()
			.split(/\s+/)
			.filter(Boolean);
		const errorMessage = host.shadowRoot?.querySelector("gcds-error-message");
		return {
			allDescriptionsExist: describedIds.every((id) =>
				Boolean(host.shadowRoot?.querySelector(`#${CSS.escape(id)}`))
			),
			ariaInvalid: input?.getAttribute("aria-invalid"),
			errorBeforeInput: Boolean(
				errorMessage &&
				input &&
				errorMessage.compareDocumentPosition(input) &
					Node.DOCUMENT_POSITION_FOLLOWING
			),
		};
	});
	expect(inputState).toEqual({
		allDescriptionsExist: true,
		ariaInvalid: "true",
		errorBeforeInput: true,
	});

	await page.locator("gcds-error-summary").getByRole("link").nth(1).click();
	const focusState = await page.evaluate(() => ({
		documentActive: document.activeElement?.tagName,
		documentActiveId: document.activeElement?.id,
		groupShadowActive: document.querySelector(
			"gcds-radios#registration-logout-mode"
		)?.shadowRoot?.activeElement?.tagName,
	}));
	expect(focusState).toEqual({
		documentActive: "GCDS-RADIOS",
		documentActiveId: "registration-logout-mode",
		groupShadowActive: "FIELDSET",
	});
	await expect
		.poll(() =>
			page
				.locator("gcds-radios#registration-logout-mode")
				.evaluate((host) =>
					Boolean(
						host.matches(":focus") &&
						host.shadowRoot?.activeElement?.matches("fieldset")
					)
				)
		)
		.toBe(true);

	const firstRadio = page
		.locator("gcds-radios#registration-logout-mode")
		.locator("input[type='radio']")
		.first();
	await expect(firstRadio).toHaveAttribute("aria-invalid", "true");
	await expect(firstRadio).toHaveAttribute(
		"aria-description",
		/Mode de déconnexion/
	);
	const firstCheckbox = page
		.locator("gcds-checkboxes#registration-scopes")
		.locator("input[type='checkbox']")
		.first();
	await expect(firstCheckbox).toHaveAttribute("aria-invalid", "true");
	await expect(firstCheckbox).toHaveAttribute(
		"aria-description",
		/Portées demandées/
	);
});

test("supports native keyboard focus and narrow long-French reflow", async ({
	page,
}) => {
	await page.setViewportSize({ height: 900, width: 320 });
	await page.locator("body").click({ position: { x: 1, y: 1 } });
	await page.keyboard.press("Tab");
	await expect(
		page.getByRole("link", { name: "Renseignements de base" })
	).toBeFocused();

	const layout = await page.evaluate(() => ({
		documentWidth: document.documentElement.scrollWidth,
		viewportWidth: document.documentElement.clientWidth,
	}));
	expect(layout.documentWidth).toBeLessThanOrEqual(layout.viewportWidth);
});
