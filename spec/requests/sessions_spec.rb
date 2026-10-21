require "rails_helper"

RSpec.describe "Sessions", type: :request do
  let(:user) { create(:user) }

  describe "GET /session/new" do
    it "renders the login form" do
      get new_session_path

      expect(response).to have_http_status(:ok)
      expect(response.body).to include("Sign in")
    end

    it "does not offer a password reset" do
      get new_session_path

      expect(response.body).not_to include("Forgot password")
    end
  end

  describe "POST /session" do
    it "logs in with valid credentials and redirects to the home page" do
      sign_in(user)

      expect(response).to redirect_to(root_url)
      follow_redirect!
      expect(response).to have_http_status(:ok)
    end

    it "returns to the page that was originally requested" do
      get root_path(page: 2)
      sign_in(user)

      expect(response).to redirect_to(root_url(page: 2))
    end

    it "rejects a wrong password" do
      sign_in(user, password: "wrong password!")

      expect(response).to redirect_to(new_session_path)
      expect(flash[:alert]).to eq("Try another email address or password.")
    end

    it "rejects an unknown email address" do
      post session_path, params: { email_address: "nobody@acme.example", password: "correct horse battery" }

      expect(response).to redirect_to(new_session_path)
      expect(flash[:alert]).to eq("Try another email address or password.")
    end
  end

  describe "DELETE /session" do
    it "logs out, after which pages require login again" do
      sign_in(user)

      delete session_path
      expect(response).to redirect_to(new_session_path)

      get root_path
      expect(response).to redirect_to(new_session_path)
    end
  end
end
