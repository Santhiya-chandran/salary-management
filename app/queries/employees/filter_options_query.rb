module Employees
  # The choices for the employee list filters and the employee form.
  # Departments and job titles are free text, so they come from the data;
  # countries and employment types are fixed lists.
  class FilterOptionsQuery
    def self.call
      new.call
    end

    def call
      {
        countries: countries,
        departments: distinct_values(:department),
        job_titles: distinct_values(:job_title),
        employment_types: Employee.employment_types.keys
      }
    end

    private
      def countries
        Country.all.sort_by(&:name).map { |country| country.to_h.slice(:code, :name, :currency) }
      end

      # One row per value via GROUP BY, sorted ignoring case so the order
      # doesn't depend on the database's collation.
      def distinct_values(column)
        Employee.group(column).order(Arel.sql("LOWER(employees.#{column}) ASC")).pluck(column)
      end
  end
end
