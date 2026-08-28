import React from "react";
import { createRoot } from "react-dom/client";
import "@gcds-core/components-react/gcds.css";
import "@gcds-core/css-shortcuts/dist/gcds-css-shortcuts.min.css";
import "@/styles/tailwind.css";
import i18n from "@/common/i18n";
import { Checkboxes, ErrorSummary, Input, Radios } from "@/components/ui";
import { WorkspaceRPRegistrationNavigation } from "@/features/workspaces/components/WorkspaceRPRegistrationNavigation";

await i18n.changeLanguage("fr");

const inputError =
	"URL de l’application (anglais) : Saisissez une URL Canada.ca valide pour cet environnement partenaire.";
const radioError =
	"Mode de déconnexion : Sélectionnez le mode de déconnexion utilisé par cette configuration.";
const checkboxError =
	"Portées demandées : Sélectionnez au moins une portée, y compris openid.";

createRoot(document.querySelector("#root") as Element).render(
	<React.StrictMode>
		<div className="grid gap-400">
			<h1>Inscrire une configuration de partie de confiance</h1>
			<WorkspaceRPRegistrationNavigation
				currentStep="signing"
				lastCompletedStep="client-and-access"
				pendingSteps={["encryption"]}
				stepPath={(step) => `/registration/${step}`}
				onNavigate={() => undefined}
			/>
			<form className="grid gap-300">
				<ErrorSummary
					errorLinks={{
						"#registration-application-url": inputError,
						"#registration-logout-mode": radioError,
						"#registration-scopes": checkboxError,
					}}
					focusOnRender
					heading="L’inscription n’a pas pu être enregistrée"
					listen={false}
				/>
				<Input
					required
					errorMessage={inputError}
					hint="Utilisez l’adresse publique complète de l’environnement en cours."
					inputId="registration-application-url"
					label="URL de l’application (anglais)"
					name="applicationEnvironmentUrlEn"
					value=""
				/>
				<Radios
					required
					errorMessage={radioError}
					legend="Mode de déconnexion"
					name="registration-logout-mode"
					options={[
						{ id: "logout-back", label: "Canal arrière", value: "back" },
						{ id: "logout-front", label: "Canal avant", value: "front" },
					]}
				/>
				<Checkboxes
					required
					errorMessage={checkboxError}
					legend="Portées demandées"
					name="registration-scopes"
					options={[
						{ id: "scope-openid", label: "openid", value: "openid" },
						{ id: "scope-profile", label: "profile", value: "profile" },
					]}
					value={[]}
				/>
			</form>
		</div>
	</React.StrictMode>
);
