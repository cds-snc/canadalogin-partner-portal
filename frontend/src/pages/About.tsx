import { CenteredPageLayout } from "../components/layout";
import type { FunctionComponent } from "../common/types";

// Components (internal)
import { Heading, Text, Card, Grid } from "../components";

const About = (): FunctionComponent => {
	return (
		<CenteredPageLayout className="max-w-6xl gap-600">
			<Heading tag="h1">About this app</Heading>

			<Text>
				This app was built using GC Design System styles and components.
			</Text>

			<Heading tag="h2">Learn more about the GC Design System</Heading>

			<Grid columnsDesktop="1fr 1fr" columnsTablet="1fr 1fr">
				<Card
					badge="Design"
					cardTitle="Figma library"
					cardTitleTag="h3"
					className="mb-300"
					description="View all of our styles and components to use in your designs."
					href="https://www.figma.com/design/mh2maMG2NBtk41k1O1UGHV/GC-Design-System?node-id=4-1006&node-type=CANVAS&t=YFNAbrqORUhggvuC-0"
					imgAlt=""
					imgSrc="/figma.png"
				/>
				<Card
					badge="Guidance"
					cardTitle="Documentation site"
					cardTitleTag="h3"
					className="mb-300"
					description="View all of our styles and components along with guidance on how to use them."
					href="https://design-system.canada.ca"
					imgAlt=""
					imgSrc="/docs.png"
				/>
				<Card
					badge="Code"
					cardTitle="GitHub repo"
					cardTitleTag="h3"
					className="mb-300"
					description="View our code in Github for all of our components."
					href="https://github.com/cds-snc/gcds-components"
					imgAlt=""
					imgSrc="/github.png"
				/>
			</Grid>
		</CenteredPageLayout>
	);
};

export default About;
