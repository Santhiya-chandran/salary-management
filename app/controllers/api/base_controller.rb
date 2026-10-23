module Api
  # Base for JSON endpoints under /api. Same session-cookie login as the rest of
  # the app, but an unauthenticated request gets 401 JSON instead of a redirect
  # to the login page, so the React app can handle it.
  class BaseController < ApplicationController
    private
      def request_authentication
        render json: { error: "You need to sign in." }, status: :unauthorized
      end
  end
end
