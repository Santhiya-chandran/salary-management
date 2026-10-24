import { describe, expect, it } from "vitest";
import { jobTitleChartData, jobTitleChartHeight } from "./jobTitleChartData";

describe("jobTitleChartData", () => {
  it("plots each job title's average salary, keeping the API's highest-first order", () => {
    const data = jobTitleChartData([
      { job_title: "Engineer", headcount: 2, average_salary: "2500000.50", median_salary: "2500000.50", min_salary: "2000000.00", max_salary: "3000001.00" },
      { job_title: "Recruiter", headcount: 1, average_salary: "900000.00", median_salary: "900000.00", min_salary: "900000.00", max_salary: "900000.00" },
    ]);

    expect(data).toEqual([
      { job_title: "Engineer", average: 2500000.5 },
      { job_title: "Recruiter", average: 900000 },
    ]);
  });
});

describe("jobTitleChartHeight", () => {
  it("gives every bar room, with a minimum height", () => {
    expect(jobTitleChartHeight(1)).toBe(160);
    expect(jobTitleChartHeight(10)).toBe(400);
  });
});
