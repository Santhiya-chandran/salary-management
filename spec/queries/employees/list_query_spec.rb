require "rails_helper"

RSpec.describe Employees::ListQuery do
  def names(result)
    result.records.map(&:full_name)
  end

  describe "with no parameters" do
    it "returns employees sorted by name, with pagination details" do
      create(:employee, full_name: "Charlie Brown")
      create(:employee, full_name: "alice Smith")
      create(:employee, full_name: "Bob Jones")

      result = described_class.call

      expect(names(result)).to eq([ "alice Smith", "Bob Jones", "Charlie Brown" ])
      expect(result.total_count).to eq(3)
      expect(result.page).to eq(1)
      expect(result.per_page).to eq(25)
      expect(result.total_pages).to eq(1)
    end
  end

  describe "name search" do
    before do
      create(:employee, full_name: "Ada Lovelace")
      create(:employee, full_name: "Grace Hopper")
      create(:employee, full_name: "Adam 100% Real")
    end

    it "matches part of the name, ignoring case" do
      expect(names(described_class.call(search: "LOVE"))).to eq([ "Ada Lovelace" ])
    end

    it "treats % and _ in the search text literally" do
      expect(names(described_class.call(search: "100%"))).to eq([ "Adam 100% Real" ])
      expect(names(described_class.call(search: "_"))).to be_empty
    end

    it "ignores a blank search" do
      expect(described_class.call(search: "  ").total_count).to eq(3)
    end
  end

  describe "filters" do
    before do
      create(:employee, full_name: "US Engineer", country: "US", currency: "USD", department: "Engineering", job_title: "Software Engineer")
      create(:employee, full_name: "US Recruiter", country: "US", currency: "USD", department: "People", job_title: "Recruiter")
      create(:employee, full_name: "India Engineer", country: "IN", currency: "INR", department: "Engineering", job_title: "Software Engineer")
    end

    it "filters by country" do
      expect(names(described_class.call(country: "IN"))).to eq([ "India Engineer" ])
    end

    it "filters by department" do
      expect(names(described_class.call(department: "People"))).to eq([ "US Recruiter" ])
    end

    it "filters by job title" do
      expect(names(described_class.call(job_title: "Software Engineer"))).to eq([ "India Engineer", "US Engineer" ])
    end

    it "combines filters and search" do
      result = described_class.call(country: "US", department: "Engineering", search: "engineer")

      expect(names(result)).to eq([ "US Engineer" ])
    end

    it "ignores blank filters" do
      expect(described_class.call(country: "", department: nil).total_count).to eq(3)
    end
  end

  describe "sorting" do
    before do
      create(:employee, full_name: "Mid", salary: BigDecimal("50000"), hire_date: Date.new(2022, 1, 1))
      create(:employee, full_name: "High", salary: BigDecimal("90000"), hire_date: Date.new(2020, 1, 1))
      create(:employee, full_name: "Low", salary: BigDecimal("10000"), hire_date: Date.new(2024, 1, 1))
    end

    it "sorts by salary in either direction" do
      expect(names(described_class.call(sort: "salary"))).to eq(%w[Low Mid High])
      expect(names(described_class.call(sort: "salary", direction: "desc"))).to eq(%w[High Mid Low])
    end

    it "sorts by hire date" do
      expect(names(described_class.call(sort: "hire_date"))).to eq(%w[High Mid Low])
    end

    it "sorts by name descending" do
      expect(names(described_class.call(sort: "full_name", direction: "desc"))).to eq(%w[Mid Low High])
    end

    it "falls back to name ascending for unknown sort columns or directions" do
      expect(names(described_class.call(sort: "id; DROP TABLE employees"))).to eq(%w[High Low Mid])
      expect(names(described_class.call(sort: "salary", direction: "sideways"))).to eq(%w[Low Mid High])
    end

    it "breaks ties by id so pages are stable" do
      first = create(:employee, full_name: "Same")
      second = create(:employee, full_name: "Same")

      expect(described_class.call(search: "Same").records).to eq([ first, second ])
    end
  end

  describe "pagination" do
    before do
      5.times { |i| create(:employee, full_name: "Person #{i}") }
    end

    it "returns the requested page" do
      result = described_class.call(page: 2, per_page: 2)

      expect(names(result)).to eq([ "Person 2", "Person 3" ])
      expect(result.total_count).to eq(5)
      expect(result.total_pages).to eq(3)
    end

    it "returns no records past the last page, with the total still correct" do
      result = described_class.call(page: 10, per_page: 2)

      expect(result.records).to be_empty
      expect(result.total_count).to eq(5)
    end

    it "treats invalid page numbers as page 1" do
      [ 0, -1, "abc", nil ].each do |page|
        expect(described_class.call(page: page, per_page: 2).page).to eq(1)
      end
    end

    it "caps the page size at 100 and defaults invalid sizes to 25" do
      expect(described_class.call(per_page: 1000).per_page).to eq(100)
      expect(described_class.call(per_page: 0).per_page).to eq(25)
      expect(described_class.call(per_page: "abc").per_page).to eq(25)
    end

    it "reports zero pages when nothing matches" do
      result = described_class.call(search: "nobody")

      expect(result.total_count).to eq(0)
      expect(result.total_pages).to eq(0)
    end
  end
end
