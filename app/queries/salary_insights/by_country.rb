module SalaryInsights
  # Headcount and min, max and average salary per country, in each country's
  # local currency. One GROUP BY in SQL; no employee records are loaded.
  class ByCountry
    Row = Data.define(:country, :currency, :headcount, :min_salary, :max_salary, :average_salary) do
      def country_name
        Country.find(country).name
      end
    end

    def self.call
      new.call
    end

    # The average is PostgreSQL's exact numeric AVG, not rounded here, so
    # anything derived from it (such as a USD conversion) stays accurate.
    def call
      Employee
        .group(:country, :currency)
        .pluck(:country, :currency, Arel.sql("COUNT(*)"), Arel.sql("MIN(salary)"),
          Arel.sql("MAX(salary)"), Arel.sql("AVG(salary)"))
        .map { |values| Row.new(*values) }
        .sort_by(&:country_name)
    end
  end
end
