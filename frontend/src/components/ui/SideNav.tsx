import { useRouterState } from "@tanstack/react-router";
import {
	GcdsNavGroup,
	GcdsNavLink,
	GcdsSideNav,
} from "@gcds-core/components-react";
import type { FunctionComponent } from "../../common/types";

const navLinks = [
	{
		groupLabel: "Holidays",
		links: [
			{ href: "/view-holidays/nationwide", label: "All" },
			{ href: "/view-holidays/federal", label: "Federal" },
			{ href: "/view-holidays/alberta", label: "Alberta" },
			{ href: "/view-holidays/british-columbia", label: "British Columbia" },
			{ href: "/view-holidays/manitoba", label: "Manitoba" },
			{ href: "/view-holidays/new-brunswick", label: "New Brunswick" },
			{
				href: "/view-holidays/newfoundland-and-labrador",
				label: "Newfoundland and Labrador",
			},
			{ href: "/view-holidays/nova-scotia", label: "Nova Scotia" },
			{
				href: "/view-holidays/northwest-territories",
				label: "Northwest Territories",
			},
			{ href: "/view-holidays/nunavut", label: "Nunavut" },
			{ href: "/view-holidays/ontario", label: "Ontario" },
			{
				href: "/view-holidays/prince-edward-island",
				label: "Prince Edward Island",
			},
			{ href: "/view-holidays/quebec", label: "Quebec" },
			{ href: "/view-holidays/saskatchewan", label: "Saskatchewan" },
			{ href: "/view-holidays/yukon", label: "Yukon" },
		],
	},
	{
		groupLabel: "Holiday information",
		links: [
			{
				href: "/federal-and-provincial-holidays",
				label: "Federal and provincial holidays",
			},
			{ href: "/optional-holidays", label: "Optional holidays" },
		],
	},
];

const SideNav = (): FunctionComponent => {
	const pathname = useRouterState({
		select: (state) => state.location.pathname,
	});
	const isCurrentPath = (href: string): boolean => pathname.includes(href);

	return (
		<GcdsSideNav className="lg:bg-light" label="Canada holidays">
			{navLinks.map((group, index) => (
				<GcdsNavGroup
					key={index}
					open
					menuLabel={group.groupLabel}
					openTrigger={group.groupLabel}
				>
					{group.links.map((item) => (
						<GcdsNavLink
							key={item.href}
							current={isCurrentPath(item.href)}
							href={item.href}
						>
							{item.label}
						</GcdsNavLink>
					))}
				</GcdsNavGroup>
			))}

			<GcdsNavLink current={isCurrentPath("/about")} href="/about">
				About this app
			</GcdsNavLink>
			<GcdsNavLink
				current={isCurrentPath("/submit-a-holiday")}
				href="/submit-a-holiday"
			>
				Submit a holiday
			</GcdsNavLink>
		</GcdsSideNav>
	);
};

export default SideNav;
