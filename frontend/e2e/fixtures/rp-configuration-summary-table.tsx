import React from "react";
import { createRoot } from "react-dom/client";
import "@gcds-core/components-react/gcds.css";
import "@gcds-core/css-shortcuts/dist/gcds-css-shortcuts.min.css";
import "@/styles/tailwind.css";
import i18n from "@/common/i18n";
import { RPApplicationSummaryTable } from "@/features/rp-applications/components/RPApplicationSummaryCard";
import type { RPApplicationSummaryRead } from "@/fetch/rp-applications";

await i18n.changeLanguage("fr");

const configurations: Array<RPApplicationSummaryRead> = [
	{
		applicationInformationUuid: "application-information-uuid-1",
		canadaLoginEnvironment: "staging",
		configurationName:
			"Configuration de préproduction pour le service de prestations canadiennes",
		partnerEnvironment:
			"Environnement partenaire de préproduction et de validation intégrée",
		productionReviewStatus: null,
		registrationCompletedAt: "2026-08-25T12:00:00Z",
		registrationLastCompletedStep: "encryption",
		resumeTaskPath: null,
		role: "read_only",
		serviceNameEn: "Canadian benefits service",
		serviceNameFr: "Service de prestations canadiennes",
		uuid: "rp-application-uuid-1",
		workspaceName: "Espace de travail des prestations",
		workspaceUuid: "workspace-uuid-1",
	},
];

createRoot(document.querySelector("#root") as Element).render(
	<React.StrictMode>
		<RPApplicationSummaryTable
			applications={configurations}
			label="Configurations RP — Service de prestations canadiennes"
		/>
	</React.StrictMode>
);
