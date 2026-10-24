require "rails_helper"

RSpec.describe SalaryInsights::ByCountry do
  before do
    create(:employee, country: "GB", currency: "GBP", salary: BigDecimal("50000"))
    create(:employee, country: "GB", currency: "GBP", salary: BigDecimal("60000"))
    create(:employee, country: "GB", currency: "GBP", salary: BigDecimal("70001"))
    create(:employee, country: "IN", currency: "INR", salary: BigDecimal("1000000"))
    create(:employee, country: "IN", currency: "INR", salary: BigDecimal("2000001"))
  end

  it "returns headcount and min, max and average salary per country, in local currency" do
    gb = described_class.call.find { |row| row.country == "GB" }

    expect(gb.currency).to eq("GBP")
    expect(gb.headcount).to eq(3)
    expect(gb.min_salary).to eq(BigDecimal("50000"))
    expect(gb.max_salary).to eq(BigDecimal("70001"))
    expect(gb.average_salary.round(2)).to eq(BigDecimal("60000.33"))
  end

  it "keeps the average exact rather than pre-rounded, as a BigDecimal" do
    gb = described_class.call.find { |row| row.country == "GB" }

    expect(gb.average_salary).to be_a(BigDecimal)
    expect(gb.average_salary).to be > BigDecimal("60000.333")
    expect(gb.average_salary).to be < BigDecimal("60000.334")
  end

  describe "median salary" do
    it "is the middle salary for an odd number of employees" do
      gb = described_class.call.find { |row| row.country == "GB" }

      expect(gb.median_salary).to eq(BigDecimal("60000"))
    end

    it "is the exact average of the two middle salaries for an even number" do
      india = described_class.call.find { |row| row.country == "IN" }

      expect(india.median_salary).to eq(BigDecimal("1500000.5"))
    end

    it "stays an exact decimal where a float would round" do
      create(:employee, country: "JP", currency: "JPY", salary: BigDecimal("9999999999999.98"))
      create(:employee, country: "JP", currency: "JPY", salary: BigDecimal("9999999999999.99"))

      japan = described_class.call.find { |row| row.country == "JP" }

      # A float median would be 9999999999999.984.
      expect(japan.median_salary).to eq(BigDecimal("9999999999999.985"))
      expect(japan.median_salary).to be_a(BigDecimal)
    end
  end

  it "never mixes countries" do
    india = described_class.call.find { |row| row.country == "IN" }

    expect(india.headcount).to eq(2)
    expect(india.average_salary).to eq(BigDecimal("1500000.5"))
  end

  it "includes only countries with employees, sorted by country name" do
    expect(described_class.call.map(&:country_name)).to eq([ "India", "United Kingdom" ])
  end

  it "aggregates in SQL without loading employees" do
    expect(records_instantiated { described_class.call }).to eq(0)
  end

  it "returns nothing when there are no employees" do
    Employee.delete_all

    expect(described_class.call).to eq([])
  end
end
