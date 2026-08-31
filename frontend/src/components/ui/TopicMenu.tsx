import React from "react";
import { GcdsTopicMenu } from "@gcds-core/components-react";

interface TopicMenuItem {
	href: string;
	label: string;
	description?: string;
}

interface TopicMenuProps {
	children?: React.ReactNode;
	className?: string;
	home?: boolean;
	menuItems?: Array<TopicMenuItem>;
}

const TopicMenu: React.FC<TopicMenuProps> = React.memo(
	({ className, home, menuItems }) => {
		const items = menuItems ?? [];

		return (
			<GcdsTopicMenu className={className} home={home}>
				{items.map((item) => (
					<a key={item.href} href={item.href}>
						{item.label}
					</a>
				))}
			</GcdsTopicMenu>
		);
	}
);

export default TopicMenu;
