module SalaryInsights
  # Each country's min, max and average salary converted to approximate USD,
  # for comparing pay across countries. Builds on ByCountry's SQL aggregates:
  # only those per-country figures are converted, never individual salaries.
  # Converting an average gives the same result as averaging converted
  # salaries, because the rate is the same for every salary in a country.
  class CrossCountryUsd
    Row = Data.define(:country, :currency, :usd_rate, :headcount, :min_usd, :max_usd, :average_usd) do
      def country_name
        Country.find(country).name
      end
    end

    def self.call
      new.call
    end

    def call
      ByCountry.call
        .map { |row| convert(row) }
        .sort_by { |row| [ -row.average_usd, row.country_name ] }
    end

    private
      def convert(row)
        country = Country.find(row.country)

        Row.new(
          country: row.country,
          currency: row.currency,
          usd_rate: country.usd_rate,
          headcount: row.headcount,
          min_usd: country.to_usd(row.min_salary),
          max_usd: country.to_usd(row.max_salary),
          average_usd: country.to_usd(row.average_salary)
        )
      end
  end
end
