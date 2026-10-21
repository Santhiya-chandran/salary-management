require "rails_helper"

# Builds every factory and trait and fails if any produces an invalid record,
# so a broken factory is reported here rather than as confusing failures in
# the specs that use it.
RSpec.describe "Factories" do
  it "are all valid" do
    expect { FactoryBot.lint(traits: true) }.not_to raise_error
  end
end
