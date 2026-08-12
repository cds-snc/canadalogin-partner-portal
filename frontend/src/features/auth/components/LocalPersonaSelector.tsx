import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import type { FunctionComponent } from "@/common/types";
import {
	Button,
	Container,
	Heading,
	Notice,
	Select,
	Text,
} from "@/components/ui";
import type { DevSessionFixture } from "@/fetch/dev-session";
import { ROLE_LABEL_KEYS } from "@/features/auth/authorization";
import { useSession } from "@/hooks";
import { getAuthorizationLandingPath } from "../auth-routing";
import {
	UnknownDevSessionFixtureError,
	useDevSession,
} from "../hooks/use-dev-session";

const getFixtureRoleSummary = (
	fixture: DevSessionFixture,
	t: (key: string, options?: Record<string, unknown>) => string
): string => {
	if (fixture.globalRole) {
		return t(ROLE_LABEL_KEYS[fixture.globalRole]);
	}

	if (fixture.partnerAccess.length === 0) {
		return t("localDevPersona.noAccessRole");
	}

	return fixture.partnerAccess
		.map((access) =>
			t("localDevPersona.workspaceRole", {
				role: t(ROLE_LABEL_KEYS[access.role]),
				workspace: access.workspaceName,
			})
		)
		.join(", ");
};

export const LocalPersonaSelector = (): FunctionComponent | null => {
	const { t } = useTranslation() as unknown as {
		t: (key: string, options?: Record<string, unknown>) => string;
	};
	const navigate = useNavigate();
	const { refreshSession } = useSession();
	const { devSession, error, isLoading, isSelecting, selectFixture } =
		useDevSession();
	const [selectedFixtureId, setSelectedFixtureId] = useState("");
	const [selectionError, setSelectionError] = useState<Error | null>(null);
	const selectionErrorReference = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (selectionError) {
			selectionErrorReference.current?.focus();
		}
	}, [selectionError]);

	// A 404 is normalized to null by the fetch helper. Loading and unavailable
	// states intentionally render nothing so non-local users never see this tool.
	if (isLoading) {
		return null;
	}

	if (error) {
		return (
			<Container id="local-persona-selector" tag="section">
				<Heading tag="h2">{t("localDevPersona.title")}</Heading>
				<Notice
					noticeRole="danger"
					noticeTitle={t("localDevPersona.availabilityErrorTitle")}
					noticeTitleTag="h3"
				>
					<Text ariaLive="assertive">
						{t("localDevPersona.availabilityErrorBody")}
					</Text>
				</Notice>
			</Container>
		);
	}

	if (!devSession) {
		return null;
	}

	const selectedFixture =
		devSession.fixtures.find(
			(fixture) => fixture.fixtureId === selectedFixtureId
		) ?? null;

	const handleSelection = async (): Promise<void> => {
		setSelectionError(null);

		try {
			await selectFixture(selectedFixtureId);
			const currentUser = await refreshSession();

			if (!currentUser) {
				throw new Error("The backend did not confirm the simulated session.");
			}

			await navigate({
				replace: true,
				search: {
					redirect: getAuthorizationLandingPath(
						currentUser.authorizationContext
					),
				},
				to: "/auth-complete",
			});
		} catch (requestError) {
			setSelectionError(requestError as Error);
		}
	};

	const selectionErrorBody =
		selectionError instanceof UnknownDevSessionFixtureError
			? t("localDevPersona.invalidFixtureBody")
			: t("localDevPersona.selectionErrorBody");

	return (
		<Container id="local-persona-selector" tag="section">
			<Heading tag="h2">{t("localDevPersona.title")}</Heading>
			<Notice
				noticeRole="warning"
				noticeTitle={t("localDevPersona.localOnlyTitle")}
				noticeTitleTag="h3"
			>
				<Text>{t("localDevPersona.localOnlyBody")}</Text>
			</Notice>

			{selectionError ? (
				<div ref={selectionErrorReference} tabIndex={-1}>
					<Notice
						noticeRole="danger"
						noticeTitle={t("localDevPersona.selectionErrorTitle")}
						noticeTitleTag="h3"
					>
						<Text ariaLive="assertive">{selectionErrorBody}</Text>
					</Notice>
				</div>
			) : null}

			<Select
				required
				hint={t("localDevPersona.selectorHint")}
				label={t("localDevPersona.selectorLabel")}
				name="local-persona"
				selectId="local-persona-select"
				value={selectedFixtureId}
				onInput={(event) => {
					setSelectionError(null);
					setSelectedFixtureId((event.target as HTMLSelectElement).value);
				}}
			>
				<option value="">{t("localDevPersona.chooseFixture")}</option>
				{devSession.fixtures.map((fixture) => (
					<option key={fixture.fixtureId} value={fixture.fixtureId}>
						{t("localDevPersona.fixtureOption", {
							name: fixture.name,
							role: getFixtureRoleSummary(fixture, t),
						})}
					</option>
				))}
			</Select>

			{selectedFixture ? (
				<div aria-live="polite" className="mb-300">
					<Heading tag="h3">{t("localDevPersona.selectedTitle")}</Heading>
					<Text marginBottom="100">
						{t("localDevPersona.selectedIdentity", {
							email: selectedFixture.email,
							name: selectedFixture.name,
						})}
					</Text>
					<Text>
						{t("localDevPersona.selectedAccess", {
							access: getFixtureRoleSummary(selectedFixture, t),
						})}
					</Text>
				</div>
			) : null}

			<Button
				buttonId="continue-with-local-persona"
				buttonRole="primary"
				disabled={!selectedFixture || isSelecting}
				type="button"
				onGcdsClick={() => {
					void handleSelection();
				}}
			>
				{isSelecting
					? t("localDevPersona.selectingAction")
					: t("localDevPersona.continueAction")}
			</Button>
			{isSelecting ? (
				<p aria-live="polite" className="sr-only" role="status">
					{t("localDevPersona.selectingAction")}
				</p>
			) : null}
		</Container>
	);
};
