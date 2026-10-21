require "rails_helper"

RSpec.describe "Home", type: :request do
  describe "GET /" do
    it "redirects to the login page when logged out" do
      get root_path

      expect(response).to redirect_to(new_session_path)
    end

    it "shows who is logged in" do
      user = create(:user, email_address: "hr@acme.example")
      sign_in(user)

      get root_path

      expect(response).to have_http_status(:ok)
      expect(response.body).to include("hr@acme.example")
    end
  end
end
