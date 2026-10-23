module SalaryInsights
  # Number of employees per country and department. Uses the
  # (country, department) index.
  class Headcount
    Row = Data.define(:country, :department, :headcount) do
      def country_name
        Country.find(country).name
      end
    end

    def self.call
      new.call
    end

    # SQL orders departments; the few resulting rows are then put in country
    # name order, which only the catalogue knows. sort_by with the index keeps
    # the department order within each country.
    def call
      Employee
        .group(:country, :department)
        .order(Arel.sql("LOWER(department) ASC"))
        .pluck(:country, :department, Arel.sql("COUNT(*)"))
        .map { |values| Row.new(*values) }
        .each_with_index.sort_by { |row, index| [ row.country_name, index ] }
        .map(&:first)
    end
  end
end
