import { useStore } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { createStore } from "zustand/vanilla";
import i18n from "@/common/i18n";
import {
	normalizeLanguageCode,
	type SupportedLanguage,
} from "@/common/language";

type AppPreferencesState = {
	language: SupportedLanguage;
	setLanguage: (language: SupportedLanguage) => Promise<void>;
	toggleLanguage: () => Promise<void>;
	reset: () => Promise<void>;
};

const getInitialLanguage = (): SupportedLanguage =>
	normalizeLanguageCode(i18n.resolvedLanguage ?? i18n.language);

const appPreferencesStore = createStore<AppPreferencesState>()(
	persist(
		(set, get) => ({
			language: getInitialLanguage(),
			setLanguage: async (language): Promise<void> => {
				const nextLanguage = normalizeLanguageCode(language);

				set({ language: nextLanguage });
				await i18n.changeLanguage(nextLanguage);
			},
			toggleLanguage: async (): Promise<void> => {
				const nextLanguage = get().language === "en" ? "fr" : "en";

				set({ language: nextLanguage });
				await i18n.changeLanguage(nextLanguage);
			},
			reset: async (): Promise<void> => {
				const nextLanguage = getInitialLanguage();

				set({ language: nextLanguage });
				await i18n.changeLanguage(nextLanguage);
			},
		}),
		{
			name: "app-preferences-store",
			partialize: (state) => ({ language: state.language }),
			storage: createJSONStorage(() => localStorage),
		}
	)
);

const useAppPreferencesState = (): {
	language: SupportedLanguage;
	setLanguage: (language: SupportedLanguage) => Promise<void>;
	toggleLanguage: () => Promise<void>;
} => {
	const language = useStore(appPreferencesStore, (state) => state.language);
	const setLanguage = useStore(
		appPreferencesStore,
		(state) => state.setLanguage
	);
	const toggleLanguage = useStore(
		appPreferencesStore,
		(state) => state.toggleLanguage
	);

	return {
		language,
		setLanguage,
		toggleLanguage,
	};
};

const resetAppPreferencesStore = async (): Promise<void> => {
	await appPreferencesStore.getState().reset();
	localStorage.removeItem("app-preferences-store");
};

export {
	appPreferencesStore,
	resetAppPreferencesStore,
	useAppPreferencesState,
};
export type { AppPreferencesState };
