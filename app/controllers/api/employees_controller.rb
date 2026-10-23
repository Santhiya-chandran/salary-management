module Api
  class EmployeesController < BaseController
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

    private
      def list_params
        params.permit(*Employees::ListQuery::PARAMS).to_h.symbolize_keys
      end
  end
end
