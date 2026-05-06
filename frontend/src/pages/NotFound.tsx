import { CenteredPageLayout } from "../components/layout";
import type { FunctionComponent } from "../common/types";

// Components (internal)
import { Heading, Link, Text } from "../components";

const NotFound = (): FunctionComponent => {
	return (
		<CenteredPageLayout>
			<Heading tag="h1">Page could not be found</Heading>
			<Text>
				Check you've entered the correct web address or{" "}
				<Link href="/">go back to the homepage</Link>.
			</Text>
		</CenteredPageLayout>
	);
};

export default NotFound;
