// TypeScript IntelliSense for VITE_ .env variables.
// VITE_ prefixed variables are exposed to the client while non-VITE_ variables aren't
// https://vitejs.dev/guide/env-and-mode.html

/// <reference types="vite/client" />

interface ImportMetaEnv {
	readonly VITE_API_BASE_URL?: string;
	readonly VITE_AUTH_POST_LOGIN_PATH?: string;
	readonly VITE_SESSION_WARNING_AFTER_MINUTES?: string;
	readonly VITE_SESSION_COUNTDOWN_MINUTES?: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
