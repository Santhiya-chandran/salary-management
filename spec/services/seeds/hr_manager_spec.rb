require "rails_helper"

RSpec.describe Seeds::HrManager do
  let(:env) { { "HR_EMAIL" => "hr@acme.example", "HR_PASSWORD" => "correct horse battery" } }

  it "creates the HR Manager login from HR_EMAIL and HR_PASSWORD" do
    user = described_class.call(env: env)

    expect(user).to be_persisted
    expect(User.authenticate_by(email_address: "hr@acme.example", password: "correct horse battery")).to eq(user)
  end

  it "can be run repeatedly without creating duplicates" do
    2.times { described_class.call(env: env) }

    expect(User.where(email_address: "hr@acme.example").count).to eq(1)
  end

  it "updates the password when re-run with a new HR_PASSWORD" do
    described_class.call(env: env)
    described_class.call(env: env.merge("HR_PASSWORD" => "a brand new password"))

    expect(User.authenticate_by(email_address: "hr@acme.example", password: "a brand new password")).to be_present
  end

  it "falls back to demo credentials when allowed and the variables are missing" do
    user = described_class.call(env: {}, allow_demo_credentials: true)

    expect(user.email_address).to eq(described_class::DEMO_EMAIL)
    expect(user.authenticate(described_class::DEMO_PASSWORD)).to eq(user)
  end

  it "refuses to use demo credentials when they are not allowed" do
    expect { described_class.call(env: {}, allow_demo_credentials: false) }
      .to raise_error(ArgumentError, "HR_EMAIL must be set")
    expect(User.count).to eq(0)
  end

  it "rejects a password that fails validation" do
    expect { described_class.call(env: env.merge("HR_PASSWORD" => "too short")) }
      .to raise_error(ActiveRecord::RecordInvalid, /Password is too short/)
  end
end
