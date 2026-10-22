require "rails_helper"
require "puma/configuration"

# Puma defaults its worker count to WEB_CONCURRENCY, which Render sets to 1.
# The app relies on running as a single process (in-memory cache and login
# rate limit, see docs/decisions.md), so config/puma.rb must override it.
RSpec.describe "config/puma.rb" do
  def workers_with(env)
    config = Puma::Configuration.new({ config_files: [ Rails.root.join("config/puma.rb").to_s ] }, {}, env)
    config.load
    config._options[:workers]
  end

  it "runs Puma in single mode even when WEB_CONCURRENCY is set" do
    expect(workers_with("WEB_CONCURRENCY" => "1")).to eq(0)
    expect(workers_with("WEB_CONCURRENCY" => "4")).to eq(0)
  end

  it "runs Puma in single mode when WEB_CONCURRENCY is not set" do
    expect(workers_with({})).to eq(0)
  end
end
