export type RouteBackLink = {
	href: string;
	label: string;
	showBackLabel?: boolean;
};

export type RouteBreadcrumb = {
	href: string;
	label: string;
};

export type RouteBackLinkContext = {
<<<<<<< HEAD
	backLink: RouteBackLink;
	breadcrumbs?: Array<RouteBreadcrumb>;
=======
	backLink?: RouteBackLink;
	breadcrumbs?: Array<RouteBackLink>;
>>>>>>> origin/main
};
