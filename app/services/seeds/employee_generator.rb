module Seeds
  # Builds attributes for demo employees from EmployeeData. Pure and
  # deterministic: no database access and no clock, and the same seed always
  # gives the same employees. Salary maths uses integers and BigDecimal only.
  class EmployeeGenerator
    def initialize(count:, seed: 42)
      @count = count
      @random = Random.new(seed)
    end

    def call
      Array.new(@count) { build_employee }
    end

    private
      def build_employee
        country = pick_weighted(EmployeeData::COUNTRY_WEIGHTS)
        department = pick(EmployeeData::DEPARTMENTS.keys)
        job_title, multiplier = pick(EmployeeData::DEPARTMENTS.fetch(department).to_a)
        employment_type = pick_weighted(EmployeeData::EMPLOYMENT_TYPE_WEIGHTS)
        names = EmployeeData::NAMES.fetch(country)

        {
          full_name: "#{pick(names[:first])} #{pick(names[:last])}",
          job_title: job_title,
          department: department,
          country: country,
          currency: Country.find(country).currency,
          salary: salary(country, multiplier, employment_type),
          employment_type: employment_type,
          hire_date: hire_date
        }
      end

      def salary(country, multiplier, employment_type)
        amount = EmployeeData::REFERENCE_SALARIES.fetch(country) * multiplier * percent(EmployeeData::SALARY_SPREAD_PERCENT)
        amount *= percent(EmployeeData::PART_TIME_PERCENT) if employment_type == "part_time"

        unit = EmployeeData::SALARY_ROUNDING.fetch(country)
        [ (amount / unit).round * unit, unit ].max.then { |value| BigDecimal(value) }
      end

      def hire_date
        range = EmployeeData::HIRE_DATES
        range.first + @random.rand(0..(range.last - range.first).to_i)
      end

      def percent(range)
        BigDecimal(@random.rand(range)) / 100
      end

      def pick(list)
        list[@random.rand(list.size)]
      end

      # Picks a key with probability proportional to its integer weight.
      def pick_weighted(weights)
        roll = @random.rand(weights.values.sum)
        weights.each do |key, weight|
          return key if roll < weight

          roll -= weight
        end
      end
  end
end
