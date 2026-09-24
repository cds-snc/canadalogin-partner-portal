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
	slot?: string;
}

const Breadcrumbs: React.FC<BreadcrumbsProps> = React.memo(
	({ items, className = "", slot }) => (
		<GcdsBreadcrumbs className={className} slot={slot}>
			{items.map((item) => (
				<GcdsBreadcrumbsItem key={item.href} href={item.href}>
					{item.label}
				</GcdsBreadcrumbsItem>
			))}
		</GcdsBreadcrumbs>
	)
);

export default Breadcrumbs;
