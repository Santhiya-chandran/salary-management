module Api
  # GET /api/employees/filters: options for the list filters and the employee form.
  class EmployeeFiltersController < BaseController
    def show
      render json: Employees::FilterOptionsQuery.call
    end
  end
end
