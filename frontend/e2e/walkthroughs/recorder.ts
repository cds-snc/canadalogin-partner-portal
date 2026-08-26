import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import {
	expect,
	type Browser,
	type BrowserContext,
	type Locator,
	type Page,
} from "@playwright/test";
import {
	WALKTHROUGH_BASE_URL,
	WALKTHROUGH_OUTPUT_DIRECTORY,
	WALKTHROUGH_PAGE_HOLD_MS,
	WALKTHROUGH_VIDEO_SIZE,
} from "./settings";

export type PersonaSlug =
	"cl-admin" | "no-access" | "read-only" | "rp-admin" | "rp-user-edit";

export type PersonaDefinition = {
	displayName: string;
	fixtureId: string;
	slug: PersonaSlug;
};

export type PageExpectation = {
	allowAccessDenied?: boolean;
	content?: RegExp | string;
	heading: RegExp | string;
};

export type PageCapture = {
	durationSeconds: number;
	endedAtSeconds: number;
	heading: string;
	label: string;
	language: string;
	navigation: "click" | "direct" | "persona-selector";
	path: string;
	sequence: number;
	startedAtSeconds: number;
};

export type SkippedCapture = {
	label: string;
	path?: string;
	reason: string;
};

export type PersonaManifest = {
	baseUrl: string;
	blockedExternalRequestCount: number;
	completedAt: string;
	exclusions: ReadonlyArray<string>;
	failure?: string;
	fixtureId: string;
	output: string;
	pageHoldMilliseconds: number;
	pages: Array<PageCapture>;
	persona: string;
	reducedMotion: true;
	schemaVersion: 1;
	skipped: Array<SkippedCapture>;
	startedAt: string;
	status: "completed" | "failed";
	video: { height: number; width: number };
};

const recordingExclusions = [
	"Compatibility redirects and layout-only route shells",
	"Destructive submissions and destructive-only terminal actions",
	"Credential and secret screens backed by IBM Security Verify",
	"Retained-registration adoption provider comparisons",
	"Invitation acceptance URLs and token-bearing invitation routes",
	"External Jira, email, support, notification, S3, and provider actions",
] as const;

const roundSeconds = (milliseconds: number): number =>
	Math.round(milliseconds / 100) / 10;

const formatFailure = (failure: unknown): string => {
	if (failure instanceof Error) {
		return failure.message;
	}
	if (typeof failure === "string") {
		return failure;
	}

	try {
		return JSON.stringify(failure) ?? "Unknown walkthrough failure";
	} catch {
		return "Unknown walkthrough failure";
	}
};

const normalizePath = (path: string): string => {
	const parsed = new URL(path, WALKTHROUGH_BASE_URL);
	return parsed.pathname === "/" ? "/" : parsed.pathname.replace(/\/$/u, "");
};

const installRecordingCues = (): void => {
	const install = (): void => {
		if (document.querySelector("#walkthrough-recording-pointer")) {
			return;
		}

		document.documentElement.classList.add("walkthrough-recording");
		const style = document.createElement("style");
		style.dataset["walkthroughRecording"] = "true";
		style.textContent = `
			html.walkthrough-recording { scroll-behavior: auto !important; }
			.tsqd-open-btn-container,
			button[aria-label="Open Tanstack query devtools"] {
				display: none !important;
			}
			html.walkthrough-recording *,
			html.walkthrough-recording *::before,
			html.walkthrough-recording *::after {
				animation-duration: 0.001ms !important;
				animation-iteration-count: 1 !important;
				transition-duration: 0.001ms !important;
			}
			html.walkthrough-recording :focus-visible {
				outline: 4px solid #ffbf47 !important;
				outline-offset: 3px !important;
			}
			#walkthrough-recording-pointer {
				background: rgba(255, 255, 255, 0.92);
				border: 3px solid #26374a;
				border-radius: 999px;
				box-shadow: 0 0 0 2px rgba(255, 191, 71, 0.95);
				height: 18px;
				left: 24px;
				pointer-events: none;
				position: fixed;
				top: 24px;
				transform: translate(-50%, -50%);
				width: 18px;
				z-index: 2147483647;
			}
			.walkthrough-recording-click-cue {
				background: rgba(255, 191, 71, 0.3);
				border: 4px solid #d93f0b;
				border-radius: 999px;
				height: 42px;
				pointer-events: none;
				position: fixed;
				transform: translate(-50%, -50%);
				width: 42px;
				z-index: 2147483646;
			}
		`;
		document.head.append(style);

		const pointer = document.createElement("div");
		pointer.id = "walkthrough-recording-pointer";
		pointer.setAttribute("aria-hidden", "true");
		document.body.append(pointer);

		document.addEventListener(
			"mousemove",
			(event) => {
				pointer.style.left = `${event.clientX}px`;
				pointer.style.top = `${event.clientY}px`;
			},
			{ passive: true }
		);
		document.addEventListener(
			"click",
			(event) => {
				const cue = document.createElement("div");
				cue.className = "walkthrough-recording-click-cue";
				cue.setAttribute("aria-hidden", "true");
				cue.style.left = `${event.clientX}px`;
				cue.style.top = `${event.clientY}px`;
				document.body.append(cue);
				globalThis.setTimeout(() => {
					cue.remove();
				}, 650);
			},
			{ capture: true, passive: true }
		);
	};

	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", install, { once: true });
	} else {
		install();
	}
};

const isAllowedLocalRequest = (requestUrl: URL): boolean =>
	(requestUrl.protocol === "http:" || requestUrl.protocol === "https:") &&
	["127.0.0.1", "::1", "[::1]", "localhost"].includes(requestUrl.hostname);

export class WalkthroughRecorder {
	public readonly page: Page;

	private blockedExternalRequestCount = 0;
	private readonly context: BrowserContext;
	private readonly pages: Array<PageCapture> = [];
	private readonly persona: PersonaDefinition;
	private readonly recordingStartedAt = Date.now();
	private readonly skipped: Array<SkippedCapture> = [];
	private readonly startedAt = new Date().toISOString();

	private constructor(
		context: BrowserContext,
		page: Page,
		persona: PersonaDefinition
	) {
		this.context = context;
		this.page = page;
		this.persona = persona;
	}

	public static async create(
		browser: Browser,
		persona: PersonaDefinition
	): Promise<WalkthroughRecorder> {
		await mkdir(WALKTHROUGH_OUTPUT_DIRECTORY, { recursive: true });
		const context = await browser.newContext({
			acceptDownloads: false,
			baseURL: WALKTHROUGH_BASE_URL,
			colorScheme: "light",
			locale: "en-CA",
			recordVideo: {
				dir: join(
					WALKTHROUGH_OUTPUT_DIRECTORY,
					".playwright",
					"videos",
					persona.slug
				),
				size: WALKTHROUGH_VIDEO_SIZE,
			},
			reducedMotion: "reduce",
			serviceWorkers: "block",
			timezoneId: "America/Toronto",
			viewport: WALKTHROUGH_VIDEO_SIZE,
		});
		const recorder = new WalkthroughRecorder(
			context,
			await context.newPage(),
			persona
		);

		await context.route("**/*", async (route) => {
			const requestUrl = new URL(route.request().url());
			if (
				(requestUrl.protocol === "http:" || requestUrl.protocol === "https:") &&
				!isAllowedLocalRequest(requestUrl)
			) {
				recorder.blockedExternalRequestCount += 1;
				await route.abort("blockedbyclient");
				return;
			}

			await route.continue();
		});
		await context.addInitScript(installRecordingCues);

		return recorder;
	}

	public currentPath(): string {
		return normalizePath(this.page.url());
	}

	public async capture(
		label: string,
		navigation: PageCapture["navigation"],
		expectation: PageExpectation
	): Promise<void> {
		await this.settlePage(expectation);
		const startedAtMilliseconds = Date.now() - this.recordingStartedAt;
		const gcdsHeading = this.page.locator("gcds-heading").first();
		const heading = (
			(await gcdsHeading.isVisible().catch(() => false))
				? await gcdsHeading.innerText()
				: await this.page.getByRole("heading", { level: 1 }).first().innerText()
		).trim();
		const language =
			(await this.page.locator("html").getAttribute("lang")) ?? "unknown";

		await this.holdAndScroll();
		const endedAtMilliseconds = Date.now() - this.recordingStartedAt;
		this.pages.push({
			durationSeconds: roundSeconds(
				endedAtMilliseconds - startedAtMilliseconds
			),
			endedAtSeconds: roundSeconds(endedAtMilliseconds),
			heading,
			label,
			language,
			navigation,
			path: this.currentPath(),
			sequence: this.pages.length + 1,
			startedAtSeconds: roundSeconds(startedAtMilliseconds),
		});
	}

	public async openPath(
		path: string,
		label: string,
		expectation: PageExpectation
	): Promise<void> {
		const expectedPath = normalizePath(path);
		if (this.currentPath() === expectedPath) {
			await this.capture(label, "direct", expectation);
			return;
		}

		const link = await this.findVisibleLink(
			(candidatePath) => candidatePath === expectedPath
		);
		if (link) {
			await this.click(link);
			await this.waitForPath((candidatePath) => candidatePath === expectedPath);
			await this.capture(label, "click", expectation);
			return;
		}

		await this.page.goto(expectedPath, { waitUntil: "domcontentloaded" });
		await this.waitForPath((candidatePath) => candidatePath === expectedPath);
		await this.capture(label, "direct", expectation);
	}

	public async follow(
		locator: Locator,
		label: string,
		expectedPath: (path: string) => boolean,
		expectation: PageExpectation
	): Promise<string> {
		const path = await this.navigate(locator, expectedPath);
		await this.capture(label, "click", expectation);
		return path;
	}

	public async navigate(
		locator: Locator,
		expectedPath: (path: string) => boolean
	): Promise<string> {
		await expect(locator).toBeVisible();
		await this.click(locator);
		await this.waitForPath(expectedPath);
		return this.currentPath();
	}

	public async findVisibleLink(
		pathMatches: (path: string) => boolean
	): Promise<Locator | null> {
		const links = this.page.getByRole("link");
		const count = await links.count();
		for (let index = 0; index < count; index += 1) {
			const link = links.nth(index);
			if (!(await link.isVisible().catch(() => false))) {
				continue;
			}

			const href = await link.getAttribute("href").catch(() => null);
			if (!href) {
				continue;
			}

			const resolved = new URL(href, WALKTHROUGH_BASE_URL);
			if (resolved.origin !== WALKTHROUGH_BASE_URL) {
				continue;
			}

			if (pathMatches(normalizePath(resolved.pathname))) {
				return link;
			}
		}

		return null;
	}

	public async collectVisibleLinkPaths(
		pathMatches: (path: string) => boolean
	): Promise<Array<string>> {
		const links = this.page.getByRole("link");
		const paths = new Set<string>();
		const count = await links.count();
		for (let index = 0; index < count; index += 1) {
			const link = links.nth(index);
			if (!(await link.isVisible().catch(() => false))) {
				continue;
			}

			const href = await link.getAttribute("href").catch(() => null);
			if (!href) {
				continue;
			}

			const resolved = new URL(href, WALKTHROUGH_BASE_URL);
			const path = normalizePath(resolved.pathname);
			if (resolved.origin === WALKTHROUGH_BASE_URL && pathMatches(path)) {
				paths.add(path);
			}
		}

		return [...paths];
	}

	public async getInternalLinkPath(locator: Locator): Promise<string> {
		await expect(locator).toBeVisible();
		const href = await locator.getAttribute("href");
		if (!href) {
			throw new Error("The visible walkthrough link did not expose an href.");
		}

		const resolved = new URL(href, WALKTHROUGH_BASE_URL);
		if (resolved.origin !== WALKTHROUGH_BASE_URL) {
			throw new Error(
				`The walkthrough refused a non-local link: ${resolved.origin}`
			);
		}

		return normalizePath(resolved.pathname);
	}

	public skip(label: string, reason: string, path?: string): void {
		this.skipped.push({ label, path, reason });
	}

	public async finalize(failure?: unknown): Promise<PersonaManifest> {
		const video = this.page.video();
		if (!this.page.isClosed()) {
			await this.page.close();
		}
		await this.context.close();

		const output = `${this.persona.slug}.webm`;
		if (video) {
			await video.saveAs(join(WALKTHROUGH_OUTPUT_DIRECTORY, output));
		}

		const manifest: PersonaManifest = {
			baseUrl: WALKTHROUGH_BASE_URL,
			blockedExternalRequestCount: this.blockedExternalRequestCount,
			completedAt: new Date().toISOString(),
			exclusions: recordingExclusions,
			fixtureId: this.persona.fixtureId,
			output,
			pageHoldMilliseconds: WALKTHROUGH_PAGE_HOLD_MS,
			pages: this.pages,
			persona: this.persona.displayName,
			reducedMotion: true,
			schemaVersion: 1,
			skipped: this.skipped,
			startedAt: this.startedAt,
			status: failure === undefined ? "completed" : "failed",
			video: WALKTHROUGH_VIDEO_SIZE,
			...(failure === undefined
				? {}
				: {
						failure: formatFailure(failure),
					}),
		};

		await writeFile(
			join(WALKTHROUGH_OUTPUT_DIRECTORY, `${this.persona.slug}.manifest.json`),
			`${JSON.stringify(manifest, null, 2)}\n`,
			"utf8"
		);
		return manifest;
	}

	private async click(locator: Locator): Promise<void> {
		await locator.scrollIntoViewIfNeeded();
		await locator.hover();
		await this.page.waitForTimeout(WALKTHROUGH_PAGE_HOLD_MS < 1000 ? 25 : 450);
		await locator.click();
	}

	private async holdAndScroll(): Promise<void> {
		const startedAt = Date.now();
		const dimensions = await this.page.evaluate(() => ({
			maximumScroll: Math.max(
				0,
				document.documentElement.scrollHeight - window.innerHeight
			),
			viewportHeight: window.innerHeight,
		}));

		if (WALKTHROUGH_PAGE_HOLD_MS >= 1000) {
			await this.page.waitForTimeout(
				Math.min(1200, Math.floor(WALKTHROUGH_PAGE_HOLD_MS / 4))
			);
		}

		if (dimensions.maximumScroll > 120) {
			const steps = Math.min(
				8,
				Math.max(
					2,
					Math.ceil(
						dimensions.maximumScroll / (dimensions.viewportHeight * 0.65)
					)
				)
			);
			for (let step = 1; step <= steps; step += 1) {
				const top = Math.round((dimensions.maximumScroll * step) / steps);
				await this.page.evaluate((scrollTop) => {
					window.scrollTo({ left: 0, top: scrollTop });
				}, top);
				await this.page.waitForTimeout(
					WALKTHROUGH_PAGE_HOLD_MS < 1000 ? 10 : 280
				);
			}

			if (WALKTHROUGH_PAGE_HOLD_MS >= 1000) {
				await this.page.waitForTimeout(500);
			}
			await this.page.evaluate(() => {
				window.scrollTo({ left: 0, top: 0 });
			});
			await this.page.waitForTimeout(
				WALKTHROUGH_PAGE_HOLD_MS < 1000 ? 10 : 450
			);
		}

		const remainingMilliseconds =
			WALKTHROUGH_PAGE_HOLD_MS - (Date.now() - startedAt);
		if (remainingMilliseconds > 0) {
			await this.page.waitForTimeout(remainingMilliseconds);
		}
	}

	private async settlePage(expectation: PageExpectation): Promise<void> {
		await this.page.waitForLoadState("domcontentloaded");
		// Client-side route changes do not reset document load states. Give React
		// Query and lazy route modules one turn to start their requests before
		// evaluating network idle for the page being recorded.
		await this.page.waitForTimeout(WALKTHROUGH_PAGE_HOLD_MS < 1000 ? 25 : 350);
		await this.page
			.waitForLoadState("networkidle", { timeout: 10_000 })
			.catch(() => undefined);
		await this.waitForLoadingStateToClear();
		await this.assertNoFailureState(expectation.allowAccessDenied === true);
		await expect(
			this.page.getByRole("heading", {
				level: 1,
				name: expectation.heading,
			})
		).toBeVisible();
		if (expectation.content !== undefined) {
			const expectedContent =
				typeof expectation.content === "string"
					? this.page.getByText(expectation.content, { exact: false })
					: this.page.getByText(expectation.content);
			await expect(expectedContent.first()).toBeVisible();
		}
		await expect(this.page.locator("html")).toHaveAttribute(
			"lang",
			/^(?:en|fr)/u
		);
		await this.page.waitForTimeout(WALKTHROUGH_PAGE_HOLD_MS < 1000 ? 25 : 400);
	}

	private async assertNoFailureState(
		allowAccessDenied: boolean
	): Promise<void> {
		const path = this.currentPath();
		if (path === "/error" || path.startsWith("/error/")) {
			throw new Error(`The walkthrough reached an error route: ${path}`);
		}
		if (!allowAccessDenied && path === "/access-denied") {
			throw new Error("The walkthrough unexpectedly reached Access denied.");
		}

		const dangerNotices = this.page.locator(
			'gcds-notice[notice-role="danger"], gcds-alert[alert-role="danger"]'
		);
		for (let index = 0; index < (await dangerNotices.count()); index += 1) {
			const notice = dangerNotices.nth(index);
			if (await notice.isVisible().catch(() => false)) {
				throw new Error(
					`The walkthrough page rendered an error notice: ${(await notice.innerText()).trim()}`
				);
			}
		}
	}

	private async waitForLoadingStateToClear(): Promise<void> {
		const loadingMessages = this.page.getByText(
			/^(?:Accepting|Checking|Finalizing|Loading)\b/iu
		);
		await expect
			.poll(
				async () => {
					for (
						let index = 0;
						index < (await loadingMessages.count());
						index += 1
					) {
						const message = loadingMessages.nth(index);
						if (await message.isVisible().catch(() => false)) {
							return (await message.innerText()).trim();
						}
					}
					return null;
				},
				{
					message: "Expected the walkthrough page loading state to clear",
					timeout: 15_000,
				}
			)
			.toBeNull();
	}

	private async waitForPath(
		pathMatches: (path: string) => boolean
	): Promise<void> {
		await expect
			.poll(() => pathMatches(this.currentPath()), {
				message: "Expected the walkthrough to reach the intended task page",
				timeout: 15_000,
			})
			.toBe(true);
	}
}

export const writeCombinedManifest = async (
	manifests: ReadonlyArray<PersonaManifest>
): Promise<void> => {
	await mkdir(WALKTHROUGH_OUTPUT_DIRECTORY, { recursive: true });
	await writeFile(
		join(WALKTHROUGH_OUTPUT_DIRECTORY, "manifest.json"),
		`${JSON.stringify(
			{
				generatedAt: new Date().toISOString(),
				journeys: manifests,
				schemaVersion: 1,
			},
			null,
			2
		)}\n`,
		"utf8"
	);
};
