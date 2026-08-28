import { expect, test } from "@playwright/test";

const tableName = "Configurations RP — Service de prestations canadiennes";
const configurationName =
	"Configuration de préproduction pour le service de prestations canadiennes";

test.beforeEach(async ({ page }) => {
	await page.goto("/e2e/fixtures/rp-configuration-summary-table.html");
	await expect(page.getByRole("table", { name: tableName })).toBeVisible();
});

test("uses the real GCDS caption, normal identity cell, and action semantics", async ({
	page,
}) => {
	const table = page.getByRole("table", { name: tableName });
	await expect(table).toBeVisible();
	await expect(table.getByRole("columnheader")).toHaveCount(6);
	await expect(table.getByRole("button")).toHaveCount(5);
	await expect(
		page.getByText("Affichage de 1 configuration de partie de confiance.")
	).toBeVisible();

	await expect(table.getByRole("rowheader")).toHaveCount(0);
	await expect(
		table.getByRole("cell", { exact: true, name: configurationName })
	).toBeVisible();
	await expect(
		table.getByText(
			"Environnement partenaire de préproduction et de validation intégrée"
		)
	).toBeVisible();

	// Managed GCDS cells project the React action through a shadow-DOM slot, so
	// locate the assigned link from the page accessibility tree.
	const links = page.getByRole("link");
	await expect(links).toHaveCount(1);
	await expect(links).toHaveAccessibleName(
		`Voir la configuration de partie de confiance pour ${configurationName}`
	);
	await expect(links).toHaveAttribute(
		"href",
		"/workspaces/workspace-uuid-1/applications/application-information-uuid-1/rp-configurations/rp-application-uuid-1"
	);
	// The real GCDS table exposes its overall sort control and each sortable
	// column before the row action. Confirm the action remains keyboard-reachable
	// without coupling the test to internal Shadow DOM tab-stop counts.
	for (let focusIndex = 0; focusIndex < 12; focusIndex += 1) {
		await page.keyboard.press("Tab");
		if (await links.evaluate((link) => link.matches(":focus"))) {
			break;
		}
	}
	await expect(links).toBeFocused();
});

test("reflows long French content at a narrow viewport equivalent to 200 percent zoom", async ({
	page,
}) => {
	await page.setViewportSize({ height: 900, width: 320 });
	await expect(page.getByRole("table", { name: tableName })).toBeVisible();

	const layout = await page.evaluate(() => ({
		documentWidth: document.documentElement.scrollWidth,
		viewportWidth: document.documentElement.clientWidth,
	}));
	expect(layout.documentWidth).toBeLessThanOrEqual(layout.viewportWidth);
	await expect(page.getByRole("link")).toBeVisible();
});
