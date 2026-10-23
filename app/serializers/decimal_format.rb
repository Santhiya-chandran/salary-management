# Formats decimals for the API as strings with a fixed number of decimal
# places, rounding half up. Never goes through Float, which can't hold large
# or fractional money values exactly; the frontend treats these as strings.
module DecimalFormat
  def self.money(amount)
    fixed(amount, places: 2)
  end

  def self.fixed(amount, places:)
    raise ArgumentError, "amount must not be a Float; use BigDecimal" if amount.is_a?(Float)

    whole, fraction = BigDecimal(amount).round(places).to_s("F").split(".")
    "#{whole}.#{fraction.to_s.ljust(places, "0")}"
  end
end
