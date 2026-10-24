require "rails_helper"

RSpec.describe SalaryInsights::ByJobTitle do
  before do
    create(:employee, country: "IN", currency: "INR", job_title: "Engineer", salary: BigDecimal("2000000"))
    create(:employee, country: "IN", currency: "INR", job_title: "Engineer", salary: BigDecimal("3000001"))
    create(:employee, country: "IN", currency: "INR", job_title: "Recruiter", salary: BigDecimal("900000"))
    create(:employee, country: "IN", currency: "INR", job_title: "analyst", salary: BigDecimal("900000"))
    # Same job title in another country must not affect India's figures.
    create(:employee, country: "US", currency: "USD", job_title: "Engineer", salary: BigDecimal("150000"))
  end

  it "returns headcount and average, min and max salary per job title within the country" do
    engineer = described_class.call(country: "IN").find { |row| row.job_title == "Engineer" }

    expect(engineer.headcount).to eq(2)
    expect(engineer.average_salary).to eq(BigDecimal("2500000.5"))
    expect(engineer.min_salary).to eq(BigDecimal("2000000"))
    expect(engineer.max_salary).to eq(BigDecimal("3000001"))
  end

  it "includes the median salary per job title, exact and within the country" do
    create(:employee, country: "IN", currency: "INR", job_title: "Engineer", salary: BigDecimal("2100000"))
    engineer = described_class.call(country: "IN").find { |row| row.job_title == "Engineer" }

    # India's engineers: 2,000,000 / 2,100,000 / 3,000,001; the US engineer is ignored.
    expect(engineer.median_salary).to eq(BigDecimal("2100000"))
    expect(engineer.median_salary).to be_a(BigDecimal)
  end

  it "sorts by average salary, highest first, then by job title ignoring case" do
    titles = described_class.call(country: "IN").map(&:job_title)

    expect(titles).to eq(%w[Engineer analyst Recruiter])
  end

  it "accepts a lowercase country code" do
    expect(described_class.call(country: "in").map(&:job_title)).to include("Engineer")
  end

  it "rejects an unsupported country" do
    expect { described_class.call(country: "XX") }.to raise_error(ArgumentError, "Unsupported country: XX")
  end

  it "returns nothing for a supported country without employees" do
    expect(described_class.call(country: "JP")).to eq([])
  end

  it "aggregates in SQL without loading employees" do
    expect(records_instantiated { described_class.call(country: "IN") }).to eq(0)
  end
end
