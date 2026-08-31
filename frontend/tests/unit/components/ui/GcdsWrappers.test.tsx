import type { PropsWithChildren, ReactElement } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ErrorSummary from "@/components/ui/ErrorSummary";
import LangToggle from "@/components/ui/LangToggle";
import Link from "@/components/ui/Link";
import Notice from "@/components/ui/Notice";
import Stepper from "@/components/ui/Stepper";
import Table from "@/components/ui/Table";
import TopicMenu from "@/components/ui/TopicMenu";

vi.mock("@gcds-core/components-react", () => ({
	GcdsErrorSummary: ({
		listen,
	}: {
		listen?: boolean;
	}): ReactElement => (
		<div data-listen={listen ? "true" : "false"}>Error summary</div>
	),
	GcdsLink: ({
		children,
		href,
		external,
	}: PropsWithChildren<{
		href: string;
		external?: boolean;
	}>): ReactElement => (
		<a data-external={external ? "true" : "false"} href={href}>
			{children}
		</a>
	),
	GcdsNotice: ({
		children,
		noticeTitle,
	}: PropsWithChildren<{ noticeTitle: string }>): ReactElement => (
		<section aria-label={noticeTitle}>{children}</section>
	),
	GcdsStepper: ({
		children,
		currentStep,
		totalSteps,
	}: PropsWithChildren<{
		currentStep: number;
		totalSteps: number;
	}>): ReactElement => (
		<div>{`${children} ${currentStep}/${totalSteps}`}</div>
	),
	GcdsTable: ({
		captionSlot,
		data,
		columns,
	}: {
		captionSlot?: React.ReactNode;
		data?: Array<Record<string, unknown>>;
		columns?: Array<Record<string, unknown>>;
	}): ReactElement => (
		<div
			data-caption={captionSlot ?? ""}
			data-columns={columns?.length ?? 0}
			data-rows={data?.length ?? 0}
			data-testid="gcds-table"
		/>
	),
	GcdsTopicMenu: ({
		home,
		children,
	}: PropsWithChildren<{ home?: boolean }>): ReactElement => (
		<nav data-home={home ? "true" : "false"}>{children}</nav>
	),
	GcdsLangToggle: ({
		lang,
		href,
	}: {
		lang: string;
		href: string;
	}): ReactElement => (
		<a data-lang={lang} data-href={href} href={href}>
			{lang === "fr" ? "Français" : "English"}
		</a>
	),
}));

describe("GCDS UI wrappers", () => {
	it("renders a notice through the shared wrapper", () => {
		render(
			<Notice noticeRole="info" noticeTitle="Heads up" noticeTitleTag="h2">
				<p>Body copy</p>
			</Notice>
		);

		expect(screen.getByLabelText("Heads up")).toBeTruthy();
		expect(screen.getByText("Body copy")).toBeTruthy();
	});

	it("renders a link through the shared wrapper", () => {
		render(<Link href="/dashboard">Dashboard</Link>);

		expect(
			screen.getByRole("link", { name: /dashboard/i }).getAttribute("href")
		).toBe("/dashboard");
	});

	it("renders an error summary through the shared wrapper", () => {
		render(<ErrorSummary listen />);

		expect(screen.getByText("Error summary").getAttribute("data-listen")).toBe(
			"true"
		);
	});

	it("renders a stepper through the shared wrapper", () => {
		render(
			<Stepper currentStep={2} tag="h2" totalSteps={4} tabIndex={-1}>
				Profile setup
			</Stepper>
		);

		expect(screen.getByText("Profile setup 2/4")).toBeTruthy();
	});

	it("renders a table through the shared wrapper", () => {
		const columns = [
			{ field: "name", header: "Name" },
			{ field: "email", header: "Email" },
		];
		const data = [
			{ name: "Jane Doe", email: "jane@example.com" },
			{ name: "John Smith", email: "john@example.com" },
		];

		render(
			<Table
				caption="Users"
				columns={columns}
				data={data}
				filter
				pagination
				sort
			/>
		);

		const table = document.querySelector("[data-testid='gcds-table']");
		expect(table).toBeTruthy();
		expect(table?.getAttribute("data-columns")).toBe("2");
		expect(table?.getAttribute("data-rows")).toBe("2");
		expect(table?.getAttribute("data-caption")).toBe("Users");
	});

	it("renders a topic menu through the shared wrapper", () => {
		render(
			<TopicMenu
				home
				menuItems={[
					{ href: "/services", label: "Services" },
					{ href: "/about", label: "About" },
				]}
			/>
		);

		const nav = document.querySelector("nav");
		expect(nav).toBeTruthy();
		expect(nav?.getAttribute("data-home")).toBe("true");
	});

	it("renders a language toggle through the shared wrapper", () => {
		render(<LangToggle lang="en" href="/fr" />);

		const link = screen.getByText("English");
		expect(link.getAttribute("data-lang")).toBe("en");
		expect(link.getAttribute("data-href")).toBe("/fr");
	});
});
