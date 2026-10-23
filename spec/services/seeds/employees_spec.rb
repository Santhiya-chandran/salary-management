require "rails_helper"

RSpec.describe Seeds::Employees do
  it "inserts the requested number of employees in batches when the table is empty" do
    result = described_class.call(count: 2_500, batch_size: 1_000)

    expect(result.inserted).to eq(2_500)
    expect(Employee.count).to eq(2_500)
  end

  it "inserts the same employees every time it seeds an empty table" do
    described_class.call(count: 50)
    first_run = Employee.order(:id).pluck(:full_name, :country, :salary)
    Employee.delete_all

    described_class.call(count: 50)

    expect(Employee.order(:id).pluck(:full_name, :country, :salary)).to eq(first_run)
  end

  it "sets timestamps on the inserted rows" do
    described_class.call(count: 10)

    expect(Employee.where(created_at: nil).or(Employee.where(updated_at: nil))).to be_empty
  end

  it "adds nothing when run a second time" do
    described_class.call(count: 100)

    result = described_class.call(count: 100)

    expect(result.inserted).to eq(0)
    expect(result.existing).to eq(100)
    expect(Employee.count).to eq(100)
  end

  it "adds nothing and changes nothing when any employee already exists" do
    existing = create(:employee, full_name: "Edited By HR", salary: BigDecimal("123456"))

    result = described_class.call(count: 100)

    expect(result.inserted).to eq(0)
    expect(Employee.count).to eq(1)
    expect(existing.reload.full_name).to eq("Edited By HR")
    expect(existing.salary).to eq(BigDecimal("123456"))
  end

  it "inserts all or nothing if a batch fails" do
    good = Seeds::EmployeeGenerator.new(count: 3, seed: 42).call
    bad = good.dup.tap { |rows| rows[2] = rows[2].merge(salary: BigDecimal("0")) }
    allow(Seeds::EmployeeGenerator).to receive(:new).and_return(instance_double(Seeds::EmployeeGenerator, call: bad))

    expect { described_class.call(count: 3, batch_size: 2) }.to raise_error(ActiveRecord::StatementInvalid, /salary_positive/)
    expect(Employee.count).to eq(0)
  end
end
