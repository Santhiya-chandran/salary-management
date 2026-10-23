require "rails_helper"

RSpec.describe Employee, type: :model do
  it "is valid with the factory defaults" do
    expect(build(:employee)).to be_valid
  end

  describe "required fields" do
    %i[full_name job_title department country currency salary employment_type hire_date].each do |field|
      it "requires #{field}" do
        employee = build(:employee, field => nil)

        expect(employee).not_to be_valid
        expect(employee.errors[field]).to include("can't be blank")
      end
    end
  end

  describe "text fields" do
    it "strips and collapses whitespace so the same value groups together" do
      employee = build(:employee, full_name: "  Ada   Lovelace ", job_title: " Software  Engineer ", department: "Engineering  ")

      expect(employee.full_name).to eq("Ada Lovelace")
      expect(employee.job_title).to eq("Software Engineer")
      expect(employee.department).to eq("Engineering")
    end
  end

  describe "country" do
    it "must be a supported country code" do
      employee = build(:employee, country: "XX")

      expect(employee).not_to be_valid
      expect(employee.errors[:country]).to include("is not a supported country")
    end

    it "is upcased" do
      expect(build(:employee, country: "in").country).to eq("IN")
    end
  end

  describe "currency" do
    it "must be the country's currency" do
      employee = build(:employee, country: "IN", currency: "USD")

      expect(employee).not_to be_valid
      expect(employee.errors[:currency]).to include("must be INR for India")
    end

    it "accepts the country's currency" do
      expect(build(:employee, country: "IN", currency: "INR")).to be_valid
    end

    it "is upcased" do
      expect(build(:employee, country: "IN", currency: "inr").currency).to eq("INR")
    end
  end

  describe "salary" do
    it "must be greater than zero" do
      [ 0, -1 ].each do |amount|
        employee = build(:employee, salary: amount)

        expect(employee).not_to be_valid
        expect(employee.errors[:salary]).to include("must be greater than 0")
      end
    end

    it "must fit the database column" do
      employee = build(:employee, salary: BigDecimal("10000000000000"))

      expect(employee).not_to be_valid
      expect(employee.errors[:salary]).to include("must be less than 10000000000000")
    end

    it "is stored as an exact decimal with two places" do
      employee = create(:employee, salary: BigDecimal("123456.78"))

      expect(employee.reload.salary).to eq(BigDecimal("123456.78"))
      expect(employee.salary).to be_a(BigDecimal)
    end
  end

  describe "employment type" do
    it "accepts full time, part time and contractor" do
      %w[full_time part_time contractor].each do |type|
        expect(build(:employee, employment_type: type)).to be_valid
      end
    end

    it "rejects other values" do
      employee = build(:employee, employment_type: "intern")

      expect(employee).not_to be_valid
      expect(employee.errors[:employment_type]).to include("is not included in the list")
    end
  end

  describe "hire date" do
    around do |example|
      travel_to(Date.new(2026, 10, 23)) { example.run }
    end

    it "can be today" do
      expect(build(:employee, hire_date: Date.new(2026, 10, 23))).to be_valid
    end

    it "cannot be in the future" do
      employee = build(:employee, hire_date: Date.new(2026, 10, 24))

      expect(employee).not_to be_valid
      expect(employee.errors[:hire_date]).to include("can't be in the future")
    end
  end

  describe "database constraints" do
    it "rejects a non-positive salary even when validations are skipped" do
      employee = build(:employee, salary: 0)

      expect { employee.save!(validate: false) }.to raise_error(ActiveRecord::StatementInvalid, /salary_positive/)
    end

    it "rejects an unknown employment type even when validations are skipped" do
      expect {
        described_class.insert_all([ attributes_for(:employee, employment_type: "intern") ])
      }.to raise_error(ActiveRecord::StatementInvalid, /employment_type_allowed/)
    end
  end
end
