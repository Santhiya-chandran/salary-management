module Api
  # Base for JSON endpoints under /api. Same session-cookie login as the rest of
  # the app, but failures are answered with JSON and a status code instead of
  # redirects or HTML error pages, so the React app can handle them.
  class BaseController < ApplicationController
    # Request bodies must name the resource explicitly, e.g. {"employee": {...}}.
    wrap_parameters false

    rescue_from ActiveRecord::RecordNotFound do
      render json: { error: "Not found." }, status: :not_found
    end

    rescue_from ActionController::ParameterMissing do |exception|
      render json: { error: exception.message }, status: :bad_request
    end

    rescue_from ActionController::InvalidAuthenticityToken do
      render json: { error: "Invalid or missing CSRF token." }, status: :forbidden
    end

    private
      def request_authentication
        render json: { error: "You need to sign in." }, status: :unauthorized
      end

      # Validation messages keyed by field, e.g. {"salary": ["must be greater than 0"]}.
      def render_validation_errors(record)
        render json: { errors: record.errors.to_hash }, status: :unprocessable_content
      end
  end
end
