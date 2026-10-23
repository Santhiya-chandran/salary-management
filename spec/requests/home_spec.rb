require "rails_helper"

RSpec.describe "Home", type: :request do
  describe "GET /" do
    it "redirects to the login page when logged out" do
      get root_path

      expect(response).to redirect_to(new_session_path)
    end

    # Only /api responds with 401 JSON; every other page redirects, whatever
    # format the request asks for.
    it "redirects to the login page even when JSON is requested" do
      get root_path, headers: { "Accept" => "application/json" }

      expect(response).to redirect_to(new_session_path)
    end

    context "when logged in" do
      let(:user) { create(:user, email_address: "hr@acme.example") }

      before { sign_in(user) }

      it "renders the React mount point with the signed-in user's email" do
        get root_path

        expect(response).to have_http_status(:ok)
        assert_select "#root[data-user-email=?]", "hr@acme.example"
      end

      it "loads the React app" do
        get root_path

        assert_select "script[type=module][src*=?]", "/assets/application"
      end

      # The test environment disables forgery protection, which also hides the
      # csrf-token meta tag, so turn it on to check what production renders.
      it "renders the CSRF token the React app needs to sign out" do
        ActionController::Base.allow_forgery_protection = true
        get root_path

        assert_select "meta[name=csrf-token][content]"
      ensure
        ActionController::Base.allow_forgery_protection = false
      end
    end
  end

  # React Router handles these pages in the browser; Rails must serve the app
  # for them too, so refreshing or bookmarking a page works.
  describe "React app pages" do
    paths = [ "/employees", "/employees/12/edit", "/insights", "/insights/by-job-title" ]

    paths.each do |path|
      it "serves the React app at #{path} when logged in" do
        sign_in(create(:user))

        get path

        expect(response).to have_http_status(:ok)
        assert_select "#root"
      end

      it "redirects #{path} to the login page when logged out" do
        get path

        expect(response).to redirect_to(new_session_path)
      end
    end

    it "does not swallow unknown pages" do
      sign_in(create(:user))

      get "/no-such-page"

      expect(response).to have_http_status(:not_found)
    end
  end
end
