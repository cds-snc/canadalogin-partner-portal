import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { GcdsNavGroup } from "@gcds-core/components-react";
import type { FunctionComponent } from "@/common/types";
import { getDepartment } from "@/fetch/departments";
import { useRoles, useSession } from "@/hooks";

export const UserNavGroup = (): FunctionComponent => {
	const { t } = useTranslation();
	const { currentUser } = useSession();
	const { roles } = useRoles(1, 1000);
	const { data: department } = useQuery({
		enabled: Boolean(currentUser?.departmentUuid),
		queryFn: () =>
			currentUser?.departmentUuid
				? getDepartment(currentUser.departmentUuid)
				: null,
		queryKey: ["nav-department", currentUser?.departmentUuid],
	});

	if (!currentUser) {
		return null;
	}

	const roleNames = (currentUser.roleUuids ?? [])
		.map((uuid) => roles.find((r) => r.uuid === uuid)?.name)
		.filter((name): name is string => typeof name === "string" && name.trim().length > 0);

	const departmentLabel = department?.name ?? currentUser.departmentAbbreviation ?? t("yourApplications.noDepartment");

	return (
		<GcdsNavGroup menuLabel={currentUser.name} openTrigger={currentUser.name}>
			<li>
				<div className="px-400 py-300 text-sm">
					<p>{currentUser.email}</p>
					<p className="mt-100 text-[var(--gcds-text-secondary)]">
						<strong>{t("nav.organization")}:</strong>
						<br />
						{departmentLabel}
					</p>
					{roleNames.length > 0 ? (
						<div className="mt-100 text-[var(--gcds-text-secondary)]">
							<p className="mb-100"><strong>{t("nav.roles")}:</strong></p>
							<ul className="flex flex-wrap gap-100">
								{roleNames.map((roleName) => (
									<li
										key={roleName}
										className="rounded-full border border-[var(--gcds-border-default)] bg-[rgba(255,255,255,0.88)] px-200 py-100 text-xs text-[var(--gcds-text-primary)]"
									>
										{roleName}
									</li>
								))}
							</ul>
						</div>
					) : null}
				</div>
			</li>
		</GcdsNavGroup>
	);
};
