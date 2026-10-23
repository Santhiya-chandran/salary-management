# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.1].define(version: 2026_10_23_024344) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

  create_table "employees", force: :cascade do |t|
    t.string "full_name", null: false
    t.string "job_title", null: false
    t.string "department", null: false
    t.string "country", limit: 2, null: false
    t.string "currency", limit: 3, null: false
    t.decimal "salary", precision: 15, scale: 2, null: false
    t.string "employment_type", null: false
    t.date "hire_date", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["country", "department"], name: "index_employees_on_country_and_department"
    t.index ["country", "job_title"], name: "index_employees_on_country_and_job_title"
    t.index ["department"], name: "index_employees_on_department"
    t.index ["job_title"], name: "index_employees_on_job_title"
    t.check_constraint "employment_type::text = ANY (ARRAY['full_time'::character varying, 'part_time'::character varying, 'contractor'::character varying]::text[])", name: "employment_type_allowed"
    t.check_constraint "salary > 0::numeric", name: "salary_positive"
  end

  create_table "sessions", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.string "ip_address"
    t.string "user_agent"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["user_id"], name: "index_sessions_on_user_id"
  end

  create_table "users", force: :cascade do |t|
    t.string "email_address", null: false
    t.string "password_digest", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["email_address"], name: "index_users_on_email_address", unique: true
  end

  add_foreign_key "sessions", "users"
end
