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

export type FilterOptions = {
  countries: CountryOption[];
  departments: string[];
  job_titles: string[];
  employment_types: EmploymentType[];
};
