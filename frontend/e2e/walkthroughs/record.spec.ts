import { test } from "@playwright/test";
import { PERSONAS, recordPersonaJourney } from "./journeys";
import {
	type PersonaManifest,
	WalkthroughRecorder,
	writeCombinedManifest,
} from "./recorder";

const manifests: Array<PersonaManifest> = [];

test.afterAll(async () => {
	await writeCombinedManifest(manifests);
});

for (const persona of PERSONAS) {
	test(`record ${persona.displayName}`, async ({ browser }) => {
		const recorder = await WalkthroughRecorder.create(browser, persona);
		let failure: unknown;

		try {
			await recordPersonaJourney(recorder, persona);
		} catch (error: unknown) {
			failure = error;
			throw error;
		} finally {
			manifests.push(await recorder.finalize(failure));
		}
	});
}
