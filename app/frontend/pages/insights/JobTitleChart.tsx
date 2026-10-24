// Imported here rather than in the entry file so the charts CSS is split out
// with this lazy-loaded chart. It still loads after the core styles, as
// Mantine requires, because the core styles are in the main bundle.
import "@mantine/charts/styles.css";
import { BarChart } from "@mantine/charts";
import { Text } from "@mantine/core";
import type { JobTitleInsight } from "../../types";
import { jobTitleChartData, jobTitleChartHeight } from "./jobTitleChartData";

type JobTitleChartProps = {
  rows: JobTitleInsight[];
  countryName: string;
  currency: string;
};

// Horizontal bars of average salary per job title, highest first, in the
// country's own currency. A visual summary of the table below it.
export function JobTitleChart({ rows, countryName, currency }: JobTitleChartProps) {
  const title = `Average salary by job title in ${countryName} (${currency})`;
  const compact = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });
  const full = new Intl.NumberFormat("en-US", { style: "currency", currency, currencyDisplay: "code" });

  return (
    <figure aria-label={title} style={{ margin: 0 }}>
      <Text component="figcaption" fw={600} size="sm" mb="xs">
        {title}
      </Text>
      <BarChart
        h={jobTitleChartHeight(rows.length)}
        data={jobTitleChartData(rows)}
        dataKey="job_title"
        orientation="vertical"
        series={[{ name: "average", label: "Average salary", color: "blue.6" }]}
        valueFormatter={(value) => full.format(value)}
        xAxisProps={{ tickFormatter: (value: number) => compact.format(value) }}
        yAxisProps={{ width: 190 }}
        gridAxis="x"
      />
    </figure>
  );
}
