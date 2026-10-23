# The countries ACME employs people in, each with the one currency its
# salaries are paid in. Not a database table: the list changes rarely and is
# updated in code (see docs/decisions.md).
#
# USD values are derived for cross-country comparison only and never stored.
class Country < Data.define(:code, :name, :currency)
  RATES_SOURCE = "European Central Bank euro foreign exchange reference rates"
  RATES_AS_OF = Date.new(2026, 10, 22)

  # Units of each currency per 1 EUR, exactly as published by the ECB on
  # RATES_AS_OF. Kept in the ECB's form so they can be checked against the
  # source; USD rates are derived from them below.
  EUR_REFERENCE_RATES = {
    "EUR" => BigDecimal("1"),
    "USD" => BigDecimal("1.1205"),
    "GBP" => BigDecimal("0.83770"),
    "INR" => BigDecimal("106.2490"),
    "JPY" => BigDecimal("175.97"),
    "CAD" => BigDecimal("1.5725"),
    "AUD" => BigDecimal("1.5980")
  }.freeze

  ALL = [
    new(code: "AU", name: "Australia", currency: "AUD"),
    new(code: "CA", name: "Canada", currency: "CAD"),
    new(code: "DE", name: "Germany", currency: "EUR"),
    new(code: "FR", name: "France", currency: "EUR"),
    new(code: "GB", name: "United Kingdom", currency: "GBP"),
    new(code: "IN", name: "India", currency: "INR"),
    new(code: "JP", name: "Japan", currency: "JPY"),
    new(code: "US", name: "United States", currency: "USD")
  ].freeze

  def self.all
    ALL
  end

  def self.find(code)
    ALL.find { |country| country.code == code }
  end

  def self.codes
    ALL.map(&:code)
  end

  # Units of local currency per 1 USD, e.g. about 94.82 for India.
  def usd_rate
    EUR_REFERENCE_RATES.fetch(currency) / EUR_REFERENCE_RATES.fetch("USD")
  end

  # Converts an amount in this country's currency to USD, rounded to cents.
  # Multiplies before dividing so no intermediate rate is rounded.
  def to_usd(amount)
    raise ArgumentError, "amount must not be a Float; use BigDecimal" if amount.is_a?(Float)

    (BigDecimal(amount) * EUR_REFERENCE_RATES.fetch("USD") / EUR_REFERENCE_RATES.fetch(currency)).round(2)
  end
end
