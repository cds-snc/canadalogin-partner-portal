import type { PropsWithChildren } from "react";
import type { FunctionComponent } from "../../common/types";

type ContentPageLayoutProps = PropsWithChildren<{
	className?: string;
}>;

export const ContentPageLayout = ({
	children,
	className = "",
}: ContentPageLayoutProps): FunctionComponent => (
	<section
		className={`mx-0 flex w-full max-w-4xl flex-col items-start gap-400 py-500 text-left ${className}`.trim()}
	>
		{children}
	</section>
);
