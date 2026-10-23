module Seeds
  # Adds the demo employees, but only to an empty employees table, so running
  # it on every deploy never duplicates or touches existing employees. All
  # batches go in one transaction: either every employee is inserted or none.
  class Employees
    Result = Data.define(:inserted, :existing)

    def self.call(count: 10_000, batch_size: 1_000, seed: 42)
      new(count:, batch_size:, seed:).call
    end

    def initialize(count:, batch_size:, seed:)
      @count = count
      @batch_size = batch_size
      @seed = seed
    end

    def call
      existing = Employee.count
      return Result.new(inserted: 0, existing: existing) if existing.positive?

      rows = EmployeeGenerator.new(count: @count, seed: @seed).call
      Employee.transaction do
        rows.each_slice(@batch_size) { |batch| Employee.insert_all!(batch) }
      end

      Result.new(inserted: rows.size, existing: 0)
    end
  end
end
