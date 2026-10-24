# JSON shapes for the salary insights. Money is sent as two-decimal strings,
# like employee salaries (see DecimalFormat).
module SalaryInsightsSerializer
  def self.by_country(rows)
    {
      countries: rows.map do |row|
        {
          country: row.country,
          country_name: row.country_name,
          currency: row.currency,
          headcount: row.headcount,
          min_salary: DecimalFormat.money(row.min_salary),
          max_salary: DecimalFormat.money(row.max_salary),
          average_salary: DecimalFormat.money(row.average_salary),
          median_salary: DecimalFormat.money(row.median_salary)
        }
      end
    }
  end

  def self.by_job_title(country, rows)
    {
      country: country.code,
      country_name: country.name,
      currency: country.currency,
      job_titles: rows.map do |row|
        {
          job_title: row.job_title,
          headcount: row.headcount,
          average_salary: DecimalFormat.money(row.average_salary),
          median_salary: DecimalFormat.money(row.median_salary),
          min_salary: DecimalFormat.money(row.min_salary),
          max_salary: DecimalFormat.money(row.max_salary)
        }
      end
    }
  end

  def self.headcount(rows)
    {
      rows: rows.map do |row|
        { country: row.country, country_name: row.country_name, department: row.department, headcount: row.headcount }
      end
    }
  end

  def self.usd_comparison(rows)
    {
      rates_as_of: Country::RATES_AS_OF.iso8601,
      rates_source: Country::RATES_SOURCE,
      countries: rows.map do |row|
        {
          country: row.country,
          country_name: row.country_name,
          currency: row.currency,
          # Units of local currency per 1 USD, for display only.
          usd_rate: DecimalFormat.fixed(row.usd_rate, places: 4),
          headcount: row.headcount,
          min_usd: DecimalFormat.money(row.min_usd),
          max_usd: DecimalFormat.money(row.max_usd),
          average_usd: DecimalFormat.money(row.average_usd),
          median_usd: DecimalFormat.money(row.median_usd)
        }
      end
    }
  end
end
