# Provides travel_to, so date-dependent specs don't depend on the real clock.
RSpec.configure do |config|
  config.include ActiveSupport::Testing::TimeHelpers
end
