import type { PropsWithChildren, ReactElement } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ErrorSummary from "@/components/ui/ErrorSummary";
import Link from "@/components/ui/Link";
import Notice from "@/components/ui/Notice";
import Stepper from "@/components/ui/Stepper";

vi.mock("@gcds-core/components-react", () => ({
	GcdsErrorSummary: ({ listen }: { listen?: boolean }): ReactElement => (
		<div data-listen={listen ? "true" : "false"}>Error summary</div>
	),
	GcdsLink: ({ children, href, external }: PropsWithChildren<{ href: string; external?: boolean }>): ReactElement => (
		<a data-external={external ? "true" : "false"} href={href}>
			{children}
		</a>
	),
	GcdsNotice: ({ children, noticeTitle }: PropsWithChildren<{ noticeTitle: string }>): ReactElement => (
		<section aria-label={noticeTitle}>{children}</section>
	),
	GcdsStepper: ({ children, currentStep, totalSteps }: PropsWithChildren<{ currentStep: number; totalSteps: number }>): ReactElement => (
		<div>{`${children} ${currentStep}/${totalSteps}`}</div>
	),
}));

describe("GCDS UI wrappers", () => {
	it("renders a notice through the shared wrapper", () => {
		render(
			<Notice noticeRole="info" noticeTitle="Heads up" noticeTitleTag="h2">
				<p>Body copy</p>
			</Notice>,
		);

		expect(screen.getByLabelText("Heads up")).toBeTruthy();
		expect(screen.getByText("Body copy")).toBeTruthy();
	});

	it("renders a link through the shared wrapper", () => {
		render(<Link href="/dashboard">Dashboard</Link>);

		expect(screen.getByRole("link", { name: /dashboard/i }).getAttribute("href")).toBe("/dashboard");
	});

	it("renders an error summary through the shared wrapper", () => {
		render(<ErrorSummary listen />);

		expect(screen.getByText("Error summary").getAttribute("data-listen")).toBe("true");
	});

	it("renders a stepper through the shared wrapper", () => {
		render(
			<Stepper currentStep={2} tag="h2" totalSteps={4} tabIndex={-1}>
				Profile setup
			</Stepper>,
		);

		expect(screen.getByText("Profile setup 2/4")).toBeTruthy();
	});
});