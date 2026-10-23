require "rails_helper"

RSpec.describe SalaryInsights::Headcount do
  before do
    create_list(:employee, 2, country: "US", currency: "USD", department: "Engineering")
    create(:employee, country: "US", currency: "USD", department: "people")
    create(:employee, country: "IN", currency: "INR", department: "Engineering")
  end

  it "counts employees per country and department, sorted by country name then department" do
    rows = described_class.call.map { |row| [ row.country_name, row.department, row.headcount ] }

    expect(rows).to eq([
      [ "India", "Engineering", 1 ],
      [ "United States", "Engineering", 2 ],
      [ "United States", "people", 1 ]
    ])
  end

  it "aggregates in SQL without loading employees" do
    expect(records_instantiated { described_class.call }).to eq(0)
  end

  it "returns nothing when there are no employees" do
    Employee.delete_all

    expect(described_class.call).to eq([])
  end
end
