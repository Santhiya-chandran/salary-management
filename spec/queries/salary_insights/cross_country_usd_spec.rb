require "rails_helper"

# Expected USD values were calculated independently with BigDecimal from the
# ECB rates in Country (USD 1.1205, GBP 0.83770, INR 106.2490 per EUR).
RSpec.describe SalaryInsights::CrossCountryUsd do
  before do
    create(:employee, country: "GB", currency: "GBP", salary: BigDecimal("50000"))
    create(:employee, country: "GB", currency: "GBP", salary: BigDecimal("60000"))
    create(:employee, country: "GB", currency: "GBP", salary: BigDecimal("70001"))
    create(:employee, country: "IN", currency: "INR", salary: BigDecimal("1000000"))
    create(:employee, country: "IN", currency: "INR", salary: BigDecimal("2000001"))
  end

  def row_for(code)
    described_class.call.find { |row| row.country == code }
  end

  it "converts each country's min, max and average salary to USD" do
    india = row_for("IN")

    expect(india.currency).to eq("INR")
    expect(india.headcount).to eq(2)
    expect(india.min_usd).to eq(BigDecimal("10545.98"))
    expect(india.max_usd).to eq(BigDecimal("21091.97"))
    expect(india.average_usd).to eq(BigDecimal("15818.98"))
  end

  it "converts the exact average, not one already rounded to cents" do
    # The exact GB average (60000.333…) converts to 80255.91 USD; converting
    # the rounded 60000.33 would give 80255.90.
    expect(row_for("GB").average_usd).to eq(BigDecimal("80255.91"))
  end

  it "converts the median salary too" do
    expect(row_for("GB").median_usd).to eq(BigDecimal("80255.46"))
    expect(row_for("IN").median_usd).to eq(BigDecimal("15818.98"))
  end

  it "includes the rate used for each country" do
    expect(row_for("IN").usd_rate.round(4)).to eq(BigDecimal("94.8228"))
  end

  it "sorts by average USD salary, highest first" do
    expect(described_class.call.map(&:country)).to eq(%w[GB IN])
  end

  it "aggregates in SQL without loading employees" do
    expect(records_instantiated { described_class.call }).to eq(0)
  end
end
