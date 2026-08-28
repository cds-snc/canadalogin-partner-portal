import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import {
	GcdsNavGroup,
	GcdsNavLink,
	GcdsTopNav,
} from "@gcds-core/components-react";
import "@gcds-core/components-react/gcds.css";
import "@gcds-core/css-shortcuts/dist/gcds-css-shortcuts.min.css";
import "@/styles/tailwind.css";
import { useNavigationDisclosureCoordinator } from "@/features/navigation/use-navigation-disclosure-coordinator";

const labels = {
	en: {
		account: "Account",
		context: "Partner Admin — RP administrator, Benefits Workspace",
		home: "Partner portal",
		language: "Français",
		logout: "Sign out",
		workspaces: "Partner workspaces",
	},
	fr: {
		account: "Compte",
		context:
			"Administratrice partenaire — Administratrice de partie de confiance, Espace de travail des prestations",
		home: "Portail des partenaires",
		language: "English",
		logout: "Fermer la session",
		workspaces: "Espaces de travail partenaires",
	},
} as const;

const SharedNavigationFixture = (): React.ReactElement => {
	const [language, setLanguage] = useState<keyof typeof labels>("en");
	const [route, setRoute] = useState("home");
	const { closeOpenNavigation, topNavRef, userNavGroupRef } =
		useNavigationDisclosureCoordinator({
			languageKey: language,
			routeKey: route,
		});
	const text = labels[language];
	const selectDestination = (destination: string): void => {
		void closeOpenNavigation();
		setRoute(destination);
	};

	return (
		<div className="grid gap-400">
			<GcdsTopNav
				ref={topNavRef}
				alignment="end"
				label="Primary navigation"
				lang={language}
			>
				<GcdsNavLink href="#home" slot="home">
					{text.home}
				</GcdsNavLink>
				<GcdsNavLink
					href="#workspaces"
					onGcdsClick={() => selectDestination("workspaces")}
				>
					{text.workspaces}
				</GcdsNavLink>
				<GcdsNavGroup
					ref={userNavGroupRef}
					id="account-menu"
					menuLabel={text.context}
					openTrigger={text.context}
				>
					<GcdsNavLink
						href="#account"
						onGcdsClick={() => selectDestination("account")}
					>
						{text.account}
					</GcdsNavLink>
					<GcdsNavLink
						href="#logout"
						onGcdsClick={() => selectDestination("logout")}
					>
						{text.logout}
					</GcdsNavLink>
				</GcdsNavGroup>
			</GcdsTopNav>

			<div className="grid gap-200 max-w-prose">
				<p data-testid="route-state">{route}</p>
				<p data-testid="language-state">{language}</p>
				<button
					data-testid="language-switch"
					type="button"
					onClick={() => {
						void closeOpenNavigation();
						setLanguage((current) => (current === "en" ? "fr" : "en"));
					}}
				>
					{text.language}
				</button>
				<button data-testid="outside-control" type="button">
					Outside navigation
				</button>
			</div>
		</div>
	);
};

createRoot(document.querySelector("#root") as Element).render(
	<React.StrictMode>
		<SharedNavigationFixture />
	</React.StrictMode>
);
