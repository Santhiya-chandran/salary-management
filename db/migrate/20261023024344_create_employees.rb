class CreateEmployees < ActiveRecord::Migration[8.1]
  def change
    create_table :employees do |t|
      t.string :full_name, null: false
      t.string :job_title, null: false
      t.string :department, null: false
      t.string :country, null: false, limit: 2
      t.string :currency, null: false, limit: 3
      # Up to 13 digits before the point; never a float.
      t.decimal :salary, null: false, precision: 15, scale: 2
      t.string :employment_type, null: false
      t.date :hire_date, null: false

      t.timestamps
    end

    # Filters and GROUP BYs. The composite indexes also serve queries on
    # country alone, since it is their leading column.
    add_index :employees, [ :country, :job_title ]
    add_index :employees, [ :country, :department ]
    add_index :employees, :department
    add_index :employees, :job_title

    add_check_constraint :employees, "salary > 0", name: "salary_positive"
    add_check_constraint :employees, "employment_type IN ('full_time', 'part_time', 'contractor')",
      name: "employment_type_allowed"
  end
end
