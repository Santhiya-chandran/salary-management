// Shapes of the Rails JSON API (see app/serializers). Money values are
// strings with two decimals and must never be turned into JavaScript numbers.

export type EmploymentType = "full_time" | "part_time" | "contractor";

export type Employee = {
  id: number;
  full_name: string;
  job_title: string;
  department: string;
  country: string;
  country_name: string;
  currency: string;
  salary: string;
  employment_type: EmploymentType;
  hire_date: string; // ISO date, e.g. "2023-04-01"
};

export type PageMeta = {
  page: number;
  per_page: number;
  total_count: number;
  total_pages: number;
};

export type EmployeeListResponse = {
  employees: Employee[];
  meta: PageMeta;
};

export type CountryOption = {
  code: string;
  name: string;
  currency: string;
};

// Salary insights (GET /api/insights/...). All money values are strings.

export type CountryInsight = {
  country: string;
  country_name: string;
  currency: string;
  headcount: number;
  min_salary: string;
  max_salary: string;
  average_salary: string;
  median_salary: string;
};

export type JobTitleInsight = {
  job_title: string;
  headcount: number;
  average_salary: string;
  median_salary: string;
  min_salary: string;
  max_salary: string;
};

export type JobTitleInsights = {
  country: string;
  country_name: string;
  currency: string;
  job_titles: JobTitleInsight[];
};

export type HeadcountRow = {
  country: string;
  country_name: string;
  department: string;
  headcount: number;
};

export type UsdCountryInsight = {
  country: string;
  country_name: string;
  currency: string;
  usd_rate: string; // units of local currency per 1 USD
  headcount: number;
  min_usd: string;
  max_usd: string;
  average_usd: string;
  median_usd: string;
};

export type UsdComparison = {
  rates_as_of: string;
  rates_source: string;
  countries: UsdCountryInsight[];
};

export type FilterOptions = {
  countries: CountryOption[];
  departments: string[];
  job_titles: string[];
  employment_types: EmploymentType[];
};
