import React from "react";
import {
	GcdsBreadcrumbs,
	GcdsBreadcrumbsItem,
} from "@gcds-core/components-react";

export interface BreadcrumbItem {
	href: string;
	label: string;
}

interface BreadcrumbsProps {
	items: Array<BreadcrumbItem>;
	className?: string;
}

import "./breadcrumbs.css";

const Breadcrumbs: React.FC<BreadcrumbsProps> = React.memo(
	({ items, className = "" }) => {
		// Use a wrapper to control horizontal gap with GCDS CSS-shortcuts / tokens
		return (
			<div className={`gc-breadcrumbs-wrapper ${className || ""}`}>
				<GcdsBreadcrumbs>
					{items.map((item) => (
						<GcdsBreadcrumbsItem key={item.href} href={item.href}>
							{item.label}
						</GcdsBreadcrumbsItem>
					))}
				</GcdsBreadcrumbs>
			</div>
		);
	}
);

export default Breadcrumbs;
