import type { PropsWithChildren } from "react";
import type { FunctionComponent } from "../../common/types";

type CenteredPageLayoutProps = PropsWithChildren<{
	className?: string;
}>;

export const CenteredPageLayout = ({
	children,
	className = "",
}: CenteredPageLayoutProps): FunctionComponent => (
	<div
		className={`mx-auto flex w-full max-w-5xl flex-col items-stretch justify-start gap-500 py-600 text-left ${className}`.trim()}
	>
		{children}
	</div>
);
