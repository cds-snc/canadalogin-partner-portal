import { forwardRef, type PropsWithChildren, type ReactElement } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ErrorSummary from "@/components/ui/ErrorSummary";
import LangToggle from "@/components/ui/LangToggle";
import Link from "@/components/ui/Link";
import Notice from "@/components/ui/Notice";
import Stepper from "@/components/ui/Stepper";
import Table from "@/components/ui/Table";
import TopicMenu from "@/components/ui/TopicMenu";

vi.mock("@gcds-core/components-react", () => ({
	GcdsErrorSummary: forwardRef<
		HTMLDivElement,
		{
			errorLinks?: Record<string, string>;
			heading?: string;
			listen?: boolean;
		}
	>(({ errorLinks, heading, listen }, ref): ReactElement => (
		<div
			ref={ref}
			data-error-links={JSON.stringify(errorLinks ?? {})}
			data-heading={heading}
			data-listen={listen ? "true" : "false"}
			tabIndex={-1}
		>
			<div role="alert" tabIndex={-1}>
				Error summary
			</div>
		</div>
	)),
	GcdsLink: ({
		children,
		href,
		external,
		onClickCapture,
	}: PropsWithChildren<{
		href: string;
		external?: boolean;
		onClickCapture?: (event: { nativeEvent: Event }) => void;
	}>): ReactElement => (
		<a
			data-external={external ? "true" : "false"}
			href={href}
			onClick={(event) => onClickCapture?.({ nativeEvent: event.nativeEvent })}
		>
			{children}
		</a>
	),
	GcdsNavLink: ({
		children,
		href,
	}: PropsWithChildren<{
		href: string;
	}>): ReactElement => <a href={href}>{children}</a>,
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
	}>): ReactElement => <div>{`${children} ${currentStep}/${totalSteps}`}</div>,
	GcdsTable: ({
		captionSlot,
		data,
		columns,
		filter,
		lang,
		pagination,
		sort,
	}: {
		captionSlot?: React.ReactNode;
		data?: Array<Record<string, unknown>>;
		columns?: Array<Record<string, unknown>>;
		filter?: boolean;
		lang?: string;
		pagination?: boolean;
		sort?: boolean;
	}): ReactElement => (
		<div
			data-caption={captionSlot ?? ""}
			data-columns={columns?.length ?? 0}
			data-filter={filter ? "true" : "false"}
			data-lang={lang}
			data-pagination={pagination ? "true" : "false"}
			data-rows={data?.length ?? 0}
			data-sort={sort ? "true" : "false"}
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
		expect(screen.getByRole("status").getAttribute("aria-live")).toBe("polite");
	});

	it("announces a danger notice assertively", () => {
		render(
			<Notice noticeRole="danger" noticeTitle="Failed" noticeTitleTag="h2">
				<p>Try again.</p>
			</Notice>
		);

		expect(screen.getByRole("alert").getAttribute("aria-live")).toBe(
			"assertive"
		);
	});

	it("renders a link through the shared wrapper", () => {
		render(<Link href="/dashboard">Dashboard</Link>);

		expect(
			screen.getByRole("link", { name: /dashboard/i }).getAttribute("href")
		).toBe("/dashboard");
	});

	it("provides native link activation to callers without replacing link semantics", () => {
		const onGcdsClick = vi.fn((event: Event) => event.preventDefault());
		render(
			<Link href="/registration/basics" onGcdsClick={onGcdsClick}>
				Basics
			</Link>
		);

		const link = screen.getByRole("link", { name: "Basics" });
		link.click();
		expect(onGcdsClick).toHaveBeenCalledOnce();
		expect(link.getAttribute("href")).toBe("/registration/basics");
	});

	it("renders an error summary through the shared wrapper", () => {
		render(<ErrorSummary listen />);

		expect(
			screen
				.getByText("Error summary")
				.parentElement?.getAttribute("data-listen")
		).toBe("true");
	});

	it("passes explicit links and moves focus to an actionable error summary", async () => {
		const view = render(
			<>
				<button type="button">Continue editing</button>
				<ErrorSummary
					errorLinks={{ "#application-url": "Check this answer." }}
					focusOnRender
					heading="The registration could not be saved"
					listen={false}
				/>
			</>
		);

		const summary = screen.getByText("Error summary");
		expect(summary.parentElement?.getAttribute("data-error-links")).toBe(
			'{"#application-url":"Check this answer."}'
		);
		expect(summary.parentElement?.getAttribute("data-heading")).toBe(
			"The registration could not be saved"
		);
		await waitFor(() =>
			expect(document.activeElement).toBe(summary.parentElement)
		);

		const continueEditing = screen.getByRole("button", {
			name: "Continue editing",
		});
		continueEditing.focus();
		view.rerender(
			<>
				<button type="button">Continue editing</button>
				<ErrorSummary
					errorLinks={{ "#other-field": "Correct another answer." }}
					focusOnRender
					heading="The registration could not be saved"
					listen={false}
				/>
			</>
		);
		await waitFor(() =>
			expect(summary.parentElement?.getAttribute("data-error-links")).toBe(
				'{"#other-field":"Correct another answer."}'
			)
		);
		expect(document.activeElement).toBe(continueEditing);
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
		expect(table?.getAttribute("data-filter")).toBe("true");
		expect(table?.getAttribute("data-lang")).toBe("en");
		expect(table?.getAttribute("data-pagination")).toBe("true");
		expect(table?.getAttribute("data-sort")).toBe("true");
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
