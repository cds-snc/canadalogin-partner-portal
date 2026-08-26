import type { ReactNode } from "react";
import type { FunctionComponent } from "@/common/types";
import "./DescriptionList.css";

export type DescriptionListItem = {
	label: string;
	value: ReactNode;
};

type DescriptionListProps = {
	items: Array<DescriptionListItem>;
};

const DescriptionList = ({
	items,
}: DescriptionListProps): FunctionComponent => (
	<dl className="itemized-description-list">
		{items.map((item) => (
			<div key={item.label}>
				<dt>{item.label}</dt>
				<dd>{item.value}</dd>
			</div>
		))}
	</dl>
);

export default DescriptionList;
