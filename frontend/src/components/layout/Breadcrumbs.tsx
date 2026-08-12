import React from "react";
import { useTranslation } from "react-i18next";
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

const Breadcrumbs: React.FC<BreadcrumbsProps> = React.memo(
	({ items, className = "" }) => {
		const { i18n } = useTranslation();
		const lang = i18n.language?.startsWith("fr") ? "fr" : "en";

		return (
			<GcdsBreadcrumbs className={className} lang={lang}>
				{items.map((item) => (
					<GcdsBreadcrumbsItem key={item.href} href={item.href}>
						{item.label}
					</GcdsBreadcrumbsItem>
				))}
			</GcdsBreadcrumbs>
		);
	}
);

export default Breadcrumbs;
