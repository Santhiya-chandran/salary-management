FactoryBot.define do
  factory :employee do
    sequence(:full_name) { |n| "Employee #{n}" }
    job_title { "Software Engineer" }
    department { "Engineering" }
    country { "US" }
    currency { "USD" }
    salary { BigDecimal("100000") }
    employment_type { "full_time" }
    hire_date { Date.new(2024, 1, 15) }
  end
end
