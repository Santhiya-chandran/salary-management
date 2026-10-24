import type { JobTitleInsight } from "../../types";

export type JobTitleChartPoint = { job_title: string; average: number };

// Bars need numbers. Converting the decimal string to a JavaScript number is
// fine for drawing a bar; the exact figures stay in the table next to it.
export function jobTitleChartData(rows: JobTitleInsight[]): JobTitleChartPoint[] {
  return rows.map((row) => ({ job_title: row.job_title, average: Number(row.average_salary) }));
}

// About 36px per bar plus room for the axis, never shorter than 160px.
export function jobTitleChartHeight(barCount: number): number {
  return Math.max(160, barCount * 36 + 40);
}
