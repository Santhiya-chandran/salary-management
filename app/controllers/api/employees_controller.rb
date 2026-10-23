module Api
  class EmployeesController < BaseController
    PERMITTED_ATTRIBUTES = %i[
      full_name job_title department country currency salary employment_type hire_date
    ].freeze

    before_action :set_employee, only: %i[show update destroy]

    def index
      result = Employees::ListQuery.call(**list_params)

      render json: {
        employees: result.records.map { |employee| EmployeeSerializer.new(employee) },
        meta: {
          page: result.page,
          per_page: result.per_page,
          total_count: result.total_count,
          total_pages: result.total_pages
        }
      }
    end

    def show
      render json: { employee: EmployeeSerializer.new(@employee) }
    end

    def create
      employee = Employee.new(employee_params)

      if employee.save
        render json: { employee: EmployeeSerializer.new(employee) }, status: :created
      else
        render_validation_errors(employee)
      end
    end

    # Overwrites the current values, including salary; no history is kept (v1 scope).
    def update
      if @employee.update(employee_params)
        render json: { employee: EmployeeSerializer.new(@employee) }
      else
        render_validation_errors(@employee)
      end
    end

    def destroy
      @employee.destroy!
      head :no_content
    end

    private
      def set_employee
        @employee = Employee.find(params[:id])
      end

      def employee_params
        params.expect(employee: PERMITTED_ATTRIBUTES)
      end

      def list_params
        params.permit(*Employees::ListQuery::PARAMS).to_h.symbolize_keys
      end
  end
end
