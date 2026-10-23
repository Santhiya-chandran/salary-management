# Counts the Active Record objects instantiated while the block runs, so specs
# can check that an aggregation happened in SQL rather than in Ruby.
module QueryHelpers
  def records_instantiated(&block)
    count = 0
    callback = ->(_name, _start, _finish, _id, payload) { count += payload[:record_count] }
    ActiveSupport::Notifications.subscribed(callback, "instantiation.active_record", &block)
    count
  end
end

RSpec.configure do |config|
  config.include QueryHelpers
end
