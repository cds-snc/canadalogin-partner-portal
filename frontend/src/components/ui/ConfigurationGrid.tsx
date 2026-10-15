import type { CSSProperties, ReactNode } from "react";
import Grid from "./Grid";
import Text from "./Text";
import "./ConfigurationGrid.css";

export interface ConfigurationGridRow {
	edit?: ReactNode;
	field: ReactNode;
	value: ReactNode;
}

export interface ConfigurationGridProps {
	ariaLabel: string;
	fieldColumnWidth?: string;
	rows: ReadonlyArray<ConfigurationGridRow>;
}

const renderCellContent = (content: ReactNode): ReactNode =>
	typeof content === "string" || typeof content === "number" ? (
		<Text marginBottom="0">{content}</Text>
	) : (
		content
	);

const GRID_COLUMNS =
	"var(--configuration-grid-field-column-width, minmax(0, 1fr)) minmax(0, 2fr) max-content";

const ConfigurationGrid = ({
	ariaLabel,
	fieldColumnWidth,
	rows,
}: ConfigurationGridProps): React.ReactElement => (
	<section
		aria-label={ariaLabel}
		className="configuration-grid"
		style={
			fieldColumnWidth
				? ({
						"--configuration-grid-field-column-width": fieldColumnWidth,
				  } as CSSProperties)
				: undefined
		}
	>
		{rows.map((row, rowIndex) => (
			<Grid
				key={rowIndex}
				className="configuration-grid__row"
				columns="1fr"
				columnsTablet={GRID_COLUMNS}
				tag="div"
			>
				<div className="configuration-grid__field">
					{renderCellContent(row.field)}
				</div>
				<div className="configuration-grid__value">
					{renderCellContent(row.value)}
				</div>
				<div className="configuration-grid__edit">
					{row.edit}
				</div>
			</Grid>
		))}
	</section>
);

export default ConfigurationGrid;