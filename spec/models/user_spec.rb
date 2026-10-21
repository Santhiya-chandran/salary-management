require "rails_helper"

RSpec.describe User, type: :model do
  describe "email address" do
    it "is stripped and downcased" do
      user = build(:user, email_address: "  HR.Manager@ACME.example ")

      expect(user.email_address).to eq("hr.manager@acme.example")
    end

    it "is required" do
      user = build(:user, email_address: "")

      expect(user).not_to be_valid
      expect(user.errors[:email_address]).to include("can't be blank")
    end

    it "must look like an email address" do
      user = build(:user, email_address: "not-an-email")

      expect(user).not_to be_valid
      expect(user.errors[:email_address]).to include("is invalid")
    end

    it "must be unique, ignoring case" do
      create(:user, email_address: "hr@acme.example")
      user = build(:user, email_address: "HR@acme.example")

      expect(user).not_to be_valid
      expect(user.errors[:email_address]).to include("has already been taken")
    end
  end

  describe "password" do
    it "is required" do
      user = build(:user, password: nil)

      expect(user).not_to be_valid
      expect(user.errors[:password]).to include("can't be blank")
    end

    it "must be at least 12 characters" do
      user = build(:user, password: "a" * 11)

      expect(user).not_to be_valid
      expect(user.errors[:password]).to include("is too short (minimum is 12 characters)")
    end

    it "accepts 12 characters" do
      expect(build(:user, password: "a" * 12)).to be_valid
    end

    it "is not re-validated when other attributes change" do
      user = create(:user)

      expect(User.find(user.id).update(email_address: "new@acme.example")).to be(true)
    end
  end

  describe ".authenticate_by" do
    let!(:user) { create(:user, email_address: "hr@acme.example", password: "correct horse battery") }

    it "returns the user for the right password" do
      expect(User.authenticate_by(email_address: "hr@acme.example", password: "correct horse battery")).to eq(user)
    end

    it "returns nil for a wrong password" do
      expect(User.authenticate_by(email_address: "hr@acme.example", password: "wrong password!")).to be_nil
    end
  end
end
