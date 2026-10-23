module Employees
  # One page of employees for the list view: name search, exact-match filters,
  # whitelisted sorting and limit/offset pagination, all done in SQL.
  class ListQuery
    DEFAULT_PER_PAGE = 25
    MAXIMUM_PER_PAGE = 100

    # Sort keys the API accepts, mapped to SQL. Names sort case-insensitively
    # so the order doesn't depend on the database's collation.
    SORTS = {
      "full_name" => "LOWER(employees.full_name)",
      "salary" => "employees.salary",
      "hire_date" => "employees.hire_date"
    }.freeze
    DEFAULT_SORT = "full_name"
    DIRECTIONS = %w[asc desc].freeze

    # The parameters callers (such as the API) may pass through.
    PARAMS = %i[search country department job_title sort direction page per_page].freeze

    Result = Data.define(:records, :total_count, :page, :per_page) do
      def total_pages
        (total_count.to_f / per_page).ceil
      end
    end

    def self.call(**params)
      new(**params).call
    end

    def initialize(search: nil, country: nil, department: nil, job_title: nil,
                   sort: nil, direction: nil, page: nil, per_page: nil)
      @search = search.to_s.squish
      @filters = { country: country, department: department, job_title: job_title }.compact_blank
      @sort = SORTS.key?(sort) ? sort : DEFAULT_SORT
      @direction = DIRECTIONS.include?(direction) ? direction : "asc"
      @page = positive_integer(page) || 1
      @per_page = [ positive_integer(per_page) || DEFAULT_PER_PAGE, MAXIMUM_PER_PAGE ].min
    end

    def call
      scope = filtered_scope

      Result.new(
        records: scope.order(order_clause).limit(@per_page).offset((@page - 1) * @per_page).to_a,
        total_count: scope.count,
        page: @page,
        per_page: @per_page
      )
    end

    private
      def filtered_scope
        scope = Employee.where(@filters)
        return scope if @search.empty?

        scope.where("employees.full_name ILIKE ?", "%#{Employee.sanitize_sql_like(@search)}%")
      end

      # Both parts come from the whitelists above, never from raw input.
      def order_clause
        Arel.sql("#{SORTS.fetch(@sort)} #{@direction}, employees.id asc")
      end

      def positive_integer(value)
        integer = Integer(value, exception: false)
        integer if integer&.positive?
      end
  end
end
