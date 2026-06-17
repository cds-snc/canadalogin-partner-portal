import { ResponsiveLine } from "@nivo/line";
import type { FunctionComponent } from "@/common/types";

export type MAUDailyTrendPoint = {
	date: string;
	totalLogins: number;
	uniqueUsers: number;
	successLogins: number;
	failedLogins: number;
};

type MAUDailyTrendLineChartProps = {
	points: Array<MAUDailyTrendPoint>;
};

export const MAUDailyTrendLineChart = ({
	points,
}: MAUDailyTrendLineChartProps): FunctionComponent => {
	const data = [
		{
			id: "total_logins",
			data: points.map((point) => ({ x: point.date, y: point.totalLogins })),
		},
		{
			id: "unique_users",
			data: points.map((point) => ({ x: point.date, y: point.uniqueUsers })),
		},
		{
			id: "success_logins",
			data: points.map((point) => ({ x: point.date, y: point.successLogins })),
		},
		{
			id: "failed_logins",
			data: points.map((point) => ({ x: point.date, y: point.failedLogins })),
		},
	];

	return (
		<div className="h-[360px] w-full">
			<ResponsiveLine
				useMesh
				colors={["#0F4C81", "#2D5D34", "#A0443E", "#D4A017"]}
				curve="monotoneX"
				data={data}
				enableArea={false}
				enableGridX={false}
				lineWidth={2}
				margin={{ bottom: 110, left: 64, right: 24, top: 20 }}
				pointBorderWidth={2}
				pointSize={8}
				xScale={{ type: "point" }}
				yScale={{ max: "auto", min: 0, stacked: false, type: "linear" }}
				axisBottom={{
					legend: "Date",
					legendOffset: 36,
					legendPosition: "middle",
					tickPadding: 10,
					tickRotation: -35,
					tickSize: 5,
				}}
				axisLeft={{
					legend: "Value",
					legendOffset: -48,
					legendPosition: "middle",
					tickPadding: 8,
					tickSize: 5,
				}}
				legends={[
					{
						anchor: "bottom",
						direction: "row",
						itemDirection: "left-to-right",
						itemHeight: 20,
						itemOpacity: 0.9,
						itemWidth: 140,
						justify: false,
						translateY: 84,
					},
				]}
			/>
		</div>
	);
};
