import { expect, test, type Locator, type Page } from "@playwright/test";

const fixturePath = "/e2e/fixtures/shared-navigation.html";

const getAccountGroup = (page: Page): Locator =>
	page.locator("gcds-nav-group#account-menu");

const getAccountTrigger = (page: Page): Locator =>
	getAccountGroup(page).getByRole("button");

test.beforeEach(async ({ page }) => {
	await page.setViewportSize({ height: 900, width: 1280 });
	await page.goto(fixturePath);
	await expect(getAccountTrigger(page)).toHaveAttribute(
		"aria-expanded",
		"false"
	);
});

test("uses the real GCDS trigger state and returns focus after Escape", async ({
	page,
}) => {
	const trigger = getAccountTrigger(page);
	const stableLabel = "Partner Admin — RP administrator, Benefits Workspace";

	await expect(trigger).toHaveText(stableLabel);
	await trigger.click();
	await expect(trigger).toHaveAttribute("aria-expanded", "true");
	await expect(trigger).toHaveText(stableLabel);

	await page.keyboard.press("Escape");

	await expect(trigger).toHaveAttribute("aria-expanded", "false");
	await expect(trigger).toBeFocused();
});

test("dismisses on destination, outside activation, language, and mode changes", async ({
	page,
}) => {
	const trigger = getAccountTrigger(page);

	await trigger.click();
	await page.getByRole("link", { name: "Partner workspaces" }).click();
	await expect(trigger).toHaveAttribute("aria-expanded", "false");
	await expect(page.getByTestId("route-state")).toHaveText("workspaces");

	await trigger.click();
	await page.getByTestId("outside-control").click();
	await expect(trigger).toHaveAttribute("aria-expanded", "false");

	await trigger.click();
	await page.getByTestId("language-switch").click();
	await expect(trigger).toHaveAttribute("aria-expanded", "false");
	await expect(page.getByTestId("language-state")).toHaveText("fr");
	await expect(trigger).toHaveText(
		"Administratrice partenaire — Administratrice de partie de confiance, Espace de travail des prestations"
	);

	await trigger.click();
	await page.setViewportSize({ height: 900, width: 900 });
	await expect(trigger).toHaveAttribute("aria-expanded", "false");
});

test("does not let delayed focus-out work close a rapidly reopened disclosure", async ({
	page,
}) => {
	const trigger = getAccountTrigger(page);

	await trigger.click();
	await page.getByTestId("outside-control").focus();
	await expect(trigger).toHaveAttribute("aria-expanded", "false");
	await trigger.click();
	await page.waitForTimeout(250);

	await expect(trigger).toHaveAttribute("aria-expanded", "true");
});

test("preserves the GCDS mobile root Menu and Close state", async ({
	page,
}) => {
	await page.setViewportSize({ height: 800, width: 375 });
	await page.reload();

	const mobileRoot = page
		.locator("gcds-top-nav")
		.locator("gcds-nav-group.gcds-mobile-nav");
	const rootTrigger = mobileRoot.getByRole("button");
	await expect(rootTrigger).toHaveText("Menu");
	await expect(rootTrigger).toHaveAttribute("aria-expanded", "false");

	await rootTrigger.click();
	await expect(rootTrigger).toHaveText("Close");
	await expect(rootTrigger).toHaveAttribute("aria-expanded", "true");

	await rootTrigger.click();
	await expect(rootTrigger).toHaveText("Menu");
	await expect(rootTrigger).toHaveAttribute("aria-expanded", "false");
});

test("reflows at narrow, intermediate, desktop, and 200-percent rendered scale", async ({
	page,
}) => {
	await page.getByTestId("language-switch").click();

	for (const width of [320, 768, 1024, 1280]) {
		await page.setViewportSize({ height: 900, width });
		const dimensions = await page.evaluate(() => ({
			documentWidth: document.documentElement.scrollWidth,
			viewportWidth: document.documentElement.clientWidth,
		}));
		expect(dimensions.documentWidth).toBeLessThanOrEqual(
			dimensions.viewportWidth
		);
	}

	await page.setViewportSize({ height: 900, width: 640 });
	await page.evaluate(() => {
		document.body.style.zoom = "2";
	});
	const zoomedDimensions = await page.evaluate(() => ({
		documentWidth: document.documentElement.scrollWidth,
		viewportWidth: document.documentElement.clientWidth,
	}));
	expect(zoomedDimensions.documentWidth).toBeLessThanOrEqual(
		zoomedDimensions.viewportWidth
	);

	await page.setViewportSize({ height: 900, width: 1280 });
	await page.evaluate(() => {
		document.body.style.zoom = "1";
	});
	const trigger = getAccountTrigger(page);
	await trigger.focus();
	const focusStyle = await trigger.evaluate((button) => {
		const style = getComputedStyle(button);
		return { boxShadow: style.boxShadow, outlineStyle: style.outlineStyle };
	});
	expect(
		focusStyle.boxShadow !== "none" || focusStyle.outlineStyle !== "none"
	).toBe(true);
});
