import type { ReactNode } from "react";
import Grid from "./Grid";
import Link from "./Link";
import "./Tabs.css";

export interface TabsItem {
	active?: boolean;
	href: string;
	label: ReactNode;
}

export interface TabsProps {
	ariaLabel: string;
	items: ReadonlyArray<TabsItem>;
}

const Tabs = ({ ariaLabel, items }: TabsProps): React.ReactElement => (
	<nav aria-label={ariaLabel} className="tabs">
		<Grid
			className="tabs__list"
			columns="repeat(auto-fit, minmax(min(100%, 10rem), max-content))"
			tag="ul"
		>
			{items.map((item) => (
				<li key={item.href} className="tabs__item">
					<Link
						ariaCurrent={item.active ? "page" : undefined}
						className={`tabs__link${item.active ? " tabs__link--active" : ""}`}
						display="block"
						href={item.href}
					>
						{item.label}
					</Link>
				</li>
			))}
		</Grid>
	</nav>
);

export default Tabs;