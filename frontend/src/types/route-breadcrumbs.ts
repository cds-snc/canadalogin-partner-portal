export type RouteBackLink = {
	href: string;
	label: string;
	showBackLabel?: boolean;
};

export type RouteBackLinkContext = {
	backLink: RouteBackLink;
};
