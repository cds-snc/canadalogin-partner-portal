import type { PropsWithChildren } from "react";
import type { FunctionComponent } from "../../common/types";

type PageContentProps = PropsWithChildren<{
	className?: string;
}>;

export const PageContent = ({
	children,
	className = "",
}: PageContentProps): FunctionComponent => (
	<div
		className={`flex min-h-[calc(100vh-18rem)] flex-col justify-start py-700 ${className}`.trim()}
	>
		{children}
	</div>
);
