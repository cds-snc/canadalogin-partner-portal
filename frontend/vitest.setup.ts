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

function isStorageLike(value: unknown): value is Storage {
	if (typeof value !== "object" || value === null) {
		return false;
	}

	const candidate = value as Partial<Storage>;
	return (
		typeof candidate.getItem === "function" &&
		typeof candidate.setItem === "function" &&
		typeof candidate.removeItem === "function" &&
		typeof candidate.clear === "function" &&
		typeof candidate.key === "function"
	);
}

if (!isStorageLike(globalThis.localStorage)) {
	Object.defineProperty(globalThis, "localStorage", {
		configurable: true,
		value: createMemoryStorage(),
		writable: true,
	});
}

if (!isStorageLike(globalThis.sessionStorage)) {
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
