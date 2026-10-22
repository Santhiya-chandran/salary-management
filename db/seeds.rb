# Idempotent: safe to run repeatedly with `bin/rails db:seed`.

hr_manager = Seeds::HrManager.call
puts "HR Manager login: #{hr_manager.email_address}"
