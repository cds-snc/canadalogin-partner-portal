import type { PropsWithChildren, ReactElement } from "react";
import { render, waitFor } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { ManageCredentialsPage } from "@/features/your-applications/pages/ManageCredentialsPage";
import { HttpRequestError } from "@/fetch/errors";
import {
	getCurrentUserRPOAuthSetup,
	getCurrentUserRPApplicationClientCredentials,
	getCurrentUserRPApplicationRotatedClientSecrets,
} from "@/fetch/rp-applications";

const replaceMock = vi.fn();
const originalLocation = globalThis.location;

vi.mock("@tanstack/react-router", () => ({
	useParams: (): { applicationUuid: string } => ({
		applicationUuid: "application-uuid-1",
	}),
}));

vi.mock("@/components/ui/Toast", () => ({
	useToast: () => ({ success: vi.fn() }),
}));

vi.mock("@/components/ui", () => ({
	Heading: ({ children }: PropsWithChildren): ReactElement => <h1>{children}</h1>,
	Notice: ({ children }: PropsWithChildren): ReactElement => <section>{children}</section>,
	Text: ({ children }: PropsWithChildren): ReactElement => <p>{children}</p>,
}));

vi.mock("react-i18next", () => ({
	useTranslation: () => ({
		i18n: { language: "en", resolvedLanguage: "en" },
		t: (key: string): string => key,
	}),
}));

vi.mock("@/fetch/rp-applications", async () => {
	const actual = await vi.importActual("@/fetch/rp-applications");
	return {
		...actual,
		getCurrentUserRPOAuthSetup: vi.fn(),
		getCurrentUserRPApplicationClientCredentials: vi.fn(),
		getCurrentUserRPApplicationRotatedClientSecrets: vi.fn(),
	};
});

const mockedGetOAuthSetup = vi.mocked(getCurrentUserRPOAuthSetup);
const mockedGetCredentials = vi.mocked(
	getCurrentUserRPApplicationClientCredentials
);
const mockedGetRotatedSecrets = vi.mocked(
	getCurrentUserRPApplicationRotatedClientSecrets
);

describe("ManageCredentialsPage", () => {
	beforeAll(() => {
		Object.defineProperty(globalThis, "location", {
			configurable: true,
			value: { replace: replaceMock } as Pick<Location, "replace">,
		});
	});

	afterEach(() => {
		replaceMock.mockReset();
		mockedGetOAuthSetup.mockReset();
		mockedGetCredentials.mockReset();
		mockedGetRotatedSecrets.mockReset();
	});

	afterAll(() => {
		Object.defineProperty(globalThis, "location", {
			configurable: true,
			value: originalLocation,
		});
	});

	it("redirects 404 responses to the canonical not-found route", async () => {
		const notFound = new HttpRequestError({ status: 404 });
		mockedGetOAuthSetup.mockRejectedValue(notFound);
		mockedGetCredentials.mockRejectedValue(notFound);
		mockedGetRotatedSecrets.mockRejectedValue(notFound);

		render(<ManageCredentialsPage />);

		await waitFor(() => {
			expect(replaceMock).toHaveBeenCalledWith("/404");
		});
	});
});