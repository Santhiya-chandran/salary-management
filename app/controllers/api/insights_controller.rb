module Api
  # Read-only salary insights. Each action runs one SalaryInsights query (SQL
  # aggregates) and serializes the result.
  class InsightsController < BaseController
    rescue_from SalaryInsights::ByJobTitle::UnsupportedCountry do |exception|
      render json: { error: exception.message }, status: :bad_request
    end

    def by_country
      render json: SalaryInsightsSerializer.by_country(SalaryInsights::ByCountry.call)
    end

    def by_job_title
      code = params.expect(:country)
      rows = SalaryInsights::ByJobTitle.call(country: code)

      render json: SalaryInsightsSerializer.by_job_title(Country.find(code.strip.upcase), rows)
    end

    def headcount
      render json: SalaryInsightsSerializer.headcount(SalaryInsights::Headcount.call)
    end

    def usd_comparison
      render json: SalaryInsightsSerializer.usd_comparison(SalaryInsights::CrossCountryUsd.call)
    end
  end
end
