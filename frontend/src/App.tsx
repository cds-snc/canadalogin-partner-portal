import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { RouterProvider } from "@tanstack/react-router";
import type { FunctionComponent } from "./common/types";
import type { TanstackRouter } from "./main";
import { TanStackRouterDevelopmentTools } from "./components/utils/development-tools/TanStackRouterDevelopmentTools";
import { appQueryClient } from "./lib/query-client";
import { ToastHook } from "./components/ui/Toast";

type AppProps = { router: TanstackRouter };

const App = ({ router }: AppProps): FunctionComponent => {
	return (
		<QueryClientProvider client={appQueryClient}>
			<ToastHook>
				<RouterProvider router={router} />
				<TanStackRouterDevelopmentTools
					initialIsOpen={false}
					position="bottom-left"
					router={router}
				/>
				<ReactQueryDevtools initialIsOpen={false} position="bottom" />
			</ToastHook>
		</QueryClientProvider>
	);
};

export default App;
