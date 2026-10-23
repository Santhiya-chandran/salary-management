module SalaryInsights
  # Headcount and average, min and max salary per job title within one
  # country, in that country's currency. Uses the (country, job_title) index.
  class ByJobTitle
    Row = Data.define(:job_title, :headcount, :average_salary, :min_salary, :max_salary)

    def self.call(country:)
      new(country:).call
    end

    def initialize(country:)
      @country = Country.find(country.to_s.strip.upcase) or
        raise ArgumentError, "Unsupported country: #{country}"
    end

    def call
      Employee
        .where(country: @country.code)
        .group(:job_title)
        .order(Arel.sql("AVG(salary) DESC, LOWER(job_title) ASC"))
        .pluck(:job_title, Arel.sql("COUNT(*)"), Arel.sql("AVG(salary)"),
          Arel.sql("MIN(salary)"), Arel.sql("MAX(salary)"))
        .map { |values| Row.new(*values) }
    end
  end
end
