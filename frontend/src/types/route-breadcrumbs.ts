export type RouteBreadcrumbItem = {
	href: string;
	label: string;
};

export type RouteBreadcrumbContext = {
	breadcrumbs: Array<RouteBreadcrumbItem>;
};
