export const consumeInvitationTokenFragment = (): string | null => {
	const { hash, pathname } = globalThis.location;

	// Remove fragment bearer material and all untrusted query data from the
	// address bar/history before any request, navigation, or later effect.
	globalThis.history.replaceState(globalThis.history.state, "", pathname);

	const parameters = new URLSearchParams(
		hash.startsWith("#") ? hash.slice(1) : hash
	);
	const tokens = parameters.getAll("token");
	if (tokens.length !== 1) {
		return null;
	}

	const token = tokens[0]?.trim();
	return token ? token : null;
};
