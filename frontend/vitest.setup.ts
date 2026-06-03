import { expect, afterEach } from "vitest";
import { cleanup } from "@testing-library/react";
import * as matchers from "@testing-library/jest-dom/matchers";

function createMemoryStorage(): Storage {
	const entries = new Map<string, string>();

	return {
		get length(): number {
			return entries.size;
		},
		clear(): void {
			entries.clear();
		},
		getItem(key: string): string | null {
			return entries.get(key) ?? null;
		},
		key(index: number): string | null {
			return Array.from(entries.keys())[index] ?? null;
		},
		removeItem(key: string): void {
			entries.delete(key);
		},
		setItem(key: string, value: string): void {
			entries.set(key, value);
		},
	};
}

if (typeof globalThis.localStorage === "undefined") {
	Object.defineProperty(globalThis, "localStorage", {
		configurable: true,
		value: createMemoryStorage(),
		writable: true,
	});
}

if (typeof globalThis.sessionStorage === "undefined") {
	Object.defineProperty(globalThis, "sessionStorage", {
		configurable: true,
		value: createMemoryStorage(),
		writable: true,
	});
}

// extends Vitest's expect method with methods from react-testing-library
expect.extend(matchers);

// runs a cleanup after each test case (e.g. clearing jsdom)
afterEach(() => {
	cleanup();
});
