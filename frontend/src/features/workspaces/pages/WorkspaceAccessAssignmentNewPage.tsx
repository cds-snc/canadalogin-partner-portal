import { Link, useParams } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { FunctionComponent } from "@/common/types";
import { useDocumentTitle } from "@/common/use-document-title";
import {
	Button,
	DataTable,
	Heading,
	Input,
	Notice,
	Select,
	Text,
} from "@/components/ui";
import {
	isClAdmin,
	ROLE_LABEL_KEYS,
	type PartnerRole,
} from "@/features/auth/authorization";
import { getRequestErrorNotice } from "@/fetch";
import type { RoleAssignmentCandidateRead } from "@/fetch/role-assignments";
import { useSession } from "@/hooks";
import { useWorkspaceRoleAssignments } from "../hooks/use-workspace-role-assignments";

const lowerPartnerRoles: ReadonlyArray<PartnerRole> = [
	"rp_user_edit",
	"read_only",
];
const allPartnerRoles: ReadonlyArray<PartnerRole> = [
	"rp_admin",
	...lowerPartnerRoles,
];
const candidateSearchMinLength = 2;
const candidateSearchMaxLength = 100;
const exactEmailAddressPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/u;
type CandidateRow = RoleAssignmentCandidateRead & { [key: string]: unknown };

export const WorkspaceAccessAssignmentNewPage = (): FunctionComponent => {
	const { t } = useTranslation();
	const { currentUser } = useSession();
	const { workspaceUuid } = useParams({
		from: "/workspaces/$workspaceUuid/access/assignments/new",
	});
	const { assign, error, isAssigning, isSearching, searchCandidates } =
		useWorkspaceRoleAssignments(workspaceUuid);
	const actorIsClAdmin = isClAdmin(currentUser?.authorizationContext);
	const requiresExactEmail = !actorIsClAdmin;
	const roles = actorIsClAdmin ? allPartnerRoles : lowerPartnerRoles;
	const [query, setQuery] = useState("");
	const [role, setRole] = useState<PartnerRole>("read_only");
	const [results, setResults] = useState<Array<CandidateRow>>([]);
	const [hasSearched, setHasSearched] = useState(false);
	const [validationError, setValidationError] = useState<string | null>(null);
	const [localError, setLocalError] = useState<Error | null>(null);
	const [successMessage, setSuccessMessage] = useState<string | null>(null);
	const title = t("workspaces.addExistingUserTaskTitle");
	useDocumentTitle(title, t("home.title"));
	const errorNotice = getRequestErrorNotice(localError ?? error, {
		bodyKey: "workspaces.roleAssignmentsErrorBody",
		titleKey: "workspaces.roleAssignmentsErrorTitle",
	});
	const queryIsValid = (value: string): boolean =>
		value.length >= candidateSearchMinLength &&
		value.length <= candidateSearchMaxLength &&
		(!requiresExactEmail || exactEmailAddressPattern.test(value));

	const search = async (): Promise<void> => {
		const normalized = query.trim();
		setHasSearched(true);
		setSuccessMessage(null);
		setLocalError(null);
		if (!queryIsValid(normalized)) {
			setResults([]);
			setValidationError(
				requiresExactEmail
					? t("workspaces.rpAdminSearchUsersEmailError")
					: t("workspaces.searchUsersLengthError")
			);
			return;
		}
		setValidationError(null);
		try {
			setResults(await searchCandidates(normalized));
		} catch (requestError) {
			setResults([]);
			setLocalError(requestError as Error);
		}
	};

	const assignCandidate = async (userUuid: string): Promise<void> => {
		setLocalError(null);
		try {
			await assign({ role, userUuid });
		} catch (requestError) {
			setLocalError(requestError as Error);
			return;
		}
		setResults((current) =>
			current.filter((candidate) => candidate.uuid !== userUuid)
		);
		setSuccessMessage(t("workspaces.roleAssignedSuccess"));
	};

	return (
		<>
			<Heading tag="h1">{title}</Heading>
			<Text>
				{requiresExactEmail
					? t("workspaces.rpAdminMembersSearchSummary")
					: t("workspaces.membersSearchSummary")}
			</Text>
			{successMessage ? (
				<Notice
					noticeRole="success"
					noticeTitle={successMessage}
					noticeTitleTag="h2"
				>
					<Text>{successMessage}</Text>
				</Notice>
			) : null}
			{errorNotice ? (
				<Notice
					noticeRole={errorNotice.noticeRole}
					noticeTitle={t(errorNotice.titleKey as never)}
					noticeTitleTag="h2"
				>
					<Text>{errorNotice.bodyText ?? t(errorNotice.bodyKey as never)}</Text>
				</Notice>
			) : null}
			<form
				className="grid gap-300"
				onSubmit={(event) => {
					event.preventDefault();
					void search();
				}}
			>
				<Input
					errorMessage={validationError ?? undefined}
					inputId="workspace-role-candidate-search"
					maxLength={candidateSearchMaxLength}
					minLength={candidateSearchMinLength}
					name="workspace-role-candidate-search"
					type={requiresExactEmail ? "email" : "search"}
					validateOn="other"
					value={query}
					hint={
						requiresExactEmail
							? t("workspaces.rpAdminSearchUsersHint")
							: t("workspaces.searchUsersHint")
					}
					label={
						requiresExactEmail
							? t("workspaces.searchUserByEmail")
							: t("workspaces.searchUsers")
					}
					onInput={(event) => {
						const nextQuery = (event.target as HTMLInputElement).value;
						setQuery(nextQuery);
						if (queryIsValid(nextQuery.trim())) setValidationError(null);
					}}
				/>
				<Select
					label={t("workspaces.selectRole")}
					name="workspace-candidate-role"
					selectId="workspace-candidate-role"
					value={role}
					onInput={(event) => {
						setRole((event.target as HTMLSelectElement).value as PartnerRole);
					}}
				>
					{roles.map((candidateRole) => (
						<option key={candidateRole} value={candidateRole}>
							{t(ROLE_LABEL_KEYS[candidateRole] as never)}
						</option>
					))}
				</Select>
				<Button disabled={isSearching} type="submit">
					{isSearching ? t("common.searching") : t("common.search")}
				</Button>
			</form>
			{hasSearched ? (
				<DataTable<CandidateRow>
					itemLabel={t("workspaces.candidateUsersItemLabel")}
					rows={results}
					title={t("workspaces.searchResults")}
					action={{
						buttonLabel: t("workspaces.assignRoleAction"),
						onAction: (row) => void assignCandidate(row.uuid),
						screenReaderLabel: (row) => row.name,
					}}
					columns={[
						{
							field: "name",
							headerName: t("workspaces.memberName"),
							rowHeader: true,
						},
						{ field: "email", headerName: t("workspaces.memberEmail") },
					]}
					emptyMessage={
						requiresExactEmail
							? t("workspaces.rpAdminNoSearchResults")
							: t("workspaces.noSearchResults")
					}
				/>
			) : null}
			{isAssigning ? <Text>{t("workspaces.assigningRoleAction")}</Text> : null}
			<Link
				params={{ workspaceUuid }}
				to="/workspaces/$workspaceUuid/access/assignments"
			>
				{t("workspaces.backToAssignmentsAction")}
			</Link>
		</>
	);
};
