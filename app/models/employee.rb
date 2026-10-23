class Employee < ApplicationRecord
  # Salaries must be below this to fit the salary column (decimal 15,2).
  MAXIMUM_SALARY = 10**13

  enum :employment_type, {
    full_time: "full_time",
    part_time: "part_time",
    contractor: "contractor"
  }, validate: true

  # Collapse whitespace so equal values filter and group together.
  normalizes :full_name, :job_title, :department, with: ->(value) { value.squish }
  normalizes :country, :currency, with: ->(value) { value.strip.upcase }

  validates :full_name, :job_title, :department, :country, :currency, :hire_date, presence: true
  validates :employment_type, presence: true
  validates :salary, presence: true, numericality: { greater_than: 0, less_than: MAXIMUM_SALARY }
  validates :country, inclusion: { in: ->(_) { Country.codes }, message: "is not a supported country" },
    allow_blank: true
  validate :currency_matches_country
  validate :hire_date_not_in_future

  private
    def currency_matches_country
      country_record = Country.find(country)
      return if country_record.nil? || currency.blank? || currency == country_record.currency

      errors.add(:currency, "must be #{country_record.currency} for #{country_record.name}")
    end

    def hire_date_not_in_future
      errors.add(:hire_date, "can't be in the future") if hire_date.present? && hire_date > Date.current
    end
end
