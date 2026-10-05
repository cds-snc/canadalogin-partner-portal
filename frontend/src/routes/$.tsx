import { createFileRoute, redirect } from "@tanstack/react-router";

const redirectToNotFound = (): void => {
	throw redirect({ replace: true, to: "/404" }) as unknown as Error;
};

export const Route = createFileRoute("/$")({
	beforeLoad: redirectToNotFound,
});