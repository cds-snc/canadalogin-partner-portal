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
		className={`mx-auto flex w-full max-w-3xl flex-col items-stretch justify-start gap-500 py-200 text-left ${className}`.trim()}
	>
		{children}
	</div>
);
