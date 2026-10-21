# Signs in through the real login endpoint, so request specs exercise the
# same session cookie the browser gets.
module AuthenticationHelpers
  def sign_in(user, password: "correct horse battery")
    post session_path, params: { email_address: user.email_address, password: password }
  end
end

RSpec.configure do |config|
  config.include AuthenticationHelpers, type: :request
end
