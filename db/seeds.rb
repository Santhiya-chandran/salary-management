# Idempotent: safe to run repeatedly with `bin/rails db:seed`, including on
# every Render deploy (bin/render-build.sh).

hr_manager = Seeds::HrManager.call
puts "HR Manager login: #{hr_manager.email_address}"

# Only seeds an empty employees table; never duplicates or changes employees.
result = Seeds::Employees.call(count: 10_000)
if result.inserted.positive?
  puts "Seeded #{result.inserted} employees."
else
  puts "Employees already present (#{result.existing}); skipped."
end
