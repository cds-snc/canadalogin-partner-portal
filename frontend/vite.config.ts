import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import type { ProxyOptions } from "vite";
import { loadEnv, normalizePath } from "vite";
import { viteStaticCopy } from "vite-plugin-static-copy";
import tailwindcss from "@tailwindcss/vite";

const TABLE_EXPERIMENT_PACKAGES = [
	"gridjs",
	"simple-datatables",
	"tabulator-tables",
	"react-router-dom",
];

function manualChunks(id: string): string | undefined {
	const normalizedId = normalizePath(id);

	if (
		normalizedId.includes("/node_modules/ag-grid-community/") ||
		normalizedId.includes("/node_modules/ag-grid-react/")
	) {
		return "ag-grid";
	}

	if (
		TABLE_EXPERIMENT_PACKAGES.some((packageName) =>
			normalizedId.includes(`/node_modules/${packageName}/`)
		)
	) {
		return "table-experiments";
	}

	return undefined;
}

function getDevProxyTarget(configuredBaseUrl: string | undefined): string {
	const normalizedBaseUrl = configuredBaseUrl?.trim();

	return normalizedBaseUrl && normalizedBaseUrl.length > 0
		? normalizedBaseUrl.replace(/\/$/, "")
		: "http://localhost:8000";
}

// https://vitejs.dev/config/
const config = ({ mode }: { mode: string }) => {
	const env = loadEnv(mode, process.cwd(), "");
	const apiProxy: ProxyOptions = {
		target: getDevProxyTarget(env.VITE_API_BASE_URL),
		changeOrigin: true,
		secure: false,
	};

	return {
		plugins: [
			react(),
			tailwindcss(),
			TanStackRouterVite(),
			...(mode === "production"
				? [
						viteStaticCopy({
							targets: [
								{
									src: normalizePath(path.resolve("./src/assets/locales")),
									dest: normalizePath(path.resolve("./dist")),
								},
							],
						}),
					]
				: []),
		],
		resolve: {
			alias: {
				"@": path.resolve(__dirname, "./src"),
			},
		},
		server: {
			host: true,
			port: 3000,
			proxy: {
				"/api": apiProxy,
			},
			strictPort: true,
		},
		build: {
			rollupOptions: {
				output: {
					manualChunks,
				},
			},
		},
		test: {
			include: ["tests/unit/**/*.test.{ts,tsx}"],
			environment: "jsdom",
			setupFiles: ["./vitest.setup.ts"],
			css: true,
		},
	};
};

export default config;
