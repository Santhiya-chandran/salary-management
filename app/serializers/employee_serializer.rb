# The JSON shape of an employee in the API.
class EmployeeSerializer
  def initialize(employee)
    @employee = employee
  end

  def as_json(*)
    {
      id: @employee.id,
      full_name: @employee.full_name,
      job_title: @employee.job_title,
      department: @employee.department,
      country: @employee.country,
      country_name: Country.find(@employee.country)&.name,
      currency: @employee.currency,
      salary: DecimalFormat.money(@employee.salary),
      employment_type: @employee.employment_type,
      hire_date: @employee.hire_date.iso8601
    }
  end
end
