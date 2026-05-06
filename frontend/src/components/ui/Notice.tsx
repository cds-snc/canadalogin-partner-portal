import React from "react";
import { GcdsNotice } from "@gcds-core/components-react";

interface NoticeProps {
	children?: React.ReactNode;
	className?: string;
	noticeRole: "danger" | "info" | "success" | "warning";
	noticeTitle: string;
	noticeTitleTag?: "h2" | "h3" | "h4" | "h5";
	tabIndex?: number;
}

const Notice: React.FC<NoticeProps> = React.memo(
	({
		children,
		className,
		noticeRole,
		noticeTitle,
		noticeTitleTag,
		tabIndex,
	}) => (
		<GcdsNotice
			className={className}
			noticeRole={noticeRole}
			noticeTitle={noticeTitle}
			noticeTitleTag={noticeTitleTag}
			tabIndex={tabIndex}
		>
			{children}
		</GcdsNotice>
	)
);

export default Notice;
