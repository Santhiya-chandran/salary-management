require "rails_helper"

RSpec.describe Seeds::EmployeeGenerator do
  let(:attributes) { described_class.new(count: 500, seed: 42).call }

  it "produces the requested number of employees" do
    expect(attributes.size).to eq(500)
  end

  it "is deterministic: the same seed gives exactly the same employees" do
    expect(described_class.new(count: 500, seed: 42).call).to eq(attributes)
  end

  it "gives different employees for a different seed" do
    expect(described_class.new(count: 500, seed: 7).call).not_to eq(attributes)
  end

  it "doesn't depend on the current date" do
    later = travel_to(Date.new(2030, 1, 1)) { described_class.new(count: 500, seed: 42).call }

    expect(later).to eq(attributes)
  end

  it "only produces employees that pass the model's validations" do
    invalid = attributes.map { |row| Employee.new(row) }.reject(&:valid?)

    expect(invalid.map { |employee| employee.errors.full_messages }).to eq([])
  end

  it "always pays employees in their country's currency" do
    attributes.each do |row|
      expect(row[:currency]).to eq(Country.find(row[:country]).currency)
    end
  end

  it "uses exact positive BigDecimal salaries in whole currency units" do
    attributes.each do |row|
      expect(row[:salary]).to be_a(BigDecimal)
      expect(row[:salary]).to be > 0
      expect(row[:salary].frac).to eq(0)
    end
  end

  it "keeps hire dates between 2010-01-01 and 2026-09-30" do
    dates = attributes.map { |row| row[:hire_date] }

    expect(dates.min).to be >= Date.new(2010, 1, 1)
    expect(dates.max).to be <= Date.new(2026, 9, 30)
  end

  it "spreads employees across every country, employment type and department" do
    expect(attributes.map { |row| row[:country] }.uniq).to match_array(Country.codes)
    expect(attributes.map { |row| row[:employment_type] }.uniq).to match_array(%w[full_time part_time contractor])
    expect(attributes.map { |row| row[:department] }.uniq.size).to eq(Seeds::EmployeeData::DEPARTMENTS.size)
  end

  it "weights countries roughly as planned, with the US largest" do
    counts = described_class.new(count: 10_000, seed: 42).call.map { |row| row[:country] }.tally

    expect(counts.max_by { |_, count| count }.first).to eq("US")
    expect(counts["US"]).to be_within(300).of(3_000)
    expect(counts["JP"]).to be_within(150).of(400)
  end
end
