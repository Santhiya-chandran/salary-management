require "rails_helper"

RSpec.describe "Salary insights API", type: :request do
  def json
    response.parsed_body
  end

  describe "when not logged in" do
    it "returns 401 for every insight" do
      [
        api_insights_by_country_path,
        api_insights_by_job_title_path(country: "IN"),
        api_insights_headcount_path,
        api_insights_usd_comparison_path
      ].each do |path|
        get path
        expect(response).to have_http_status(:unauthorized), "expected 401 for #{path}"
      end
    end
  end

  describe "when logged in" do
    before do
      sign_in(create(:user))
      create(:employee, country: "GB", currency: "GBP", department: "Engineering", job_title: "Engineer", salary: BigDecimal("50000"))
      create(:employee, country: "GB", currency: "GBP", department: "Engineering", job_title: "Engineer", salary: BigDecimal("60000"))
      create(:employee, country: "GB", currency: "GBP", department: "People", job_title: "Recruiter", salary: BigDecimal("70001"))
      create(:employee, country: "IN", currency: "INR", department: "Engineering", job_title: "Engineer", salary: BigDecimal("1000000"))
      create(:employee, country: "IN", currency: "INR", department: "Engineering", job_title: "Engineer", salary: BigDecimal("2000001"))
    end

    describe "GET /api/insights/by_country" do
      it "returns figures per country in local currency, money as two-decimal strings" do
        get api_insights_by_country_path

        expect(response).to have_http_status(:ok)
        expect(json["countries"]).to eq([
          { "country" => "IN", "country_name" => "India", "currency" => "INR", "headcount" => 2,
            "min_salary" => "1000000.00", "max_salary" => "2000001.00", "average_salary" => "1500000.50" },
          { "country" => "GB", "country_name" => "United Kingdom", "currency" => "GBP", "headcount" => 3,
            "min_salary" => "50000.00", "max_salary" => "70001.00", "average_salary" => "60000.33" }
        ])
      end
    end

    describe "GET /api/insights/by_job_title" do
      it "returns figures per job title within the country" do
        get api_insights_by_job_title_path(country: "GB")

        expect(response).to have_http_status(:ok)
        expect(json).to eq(
          "country" => "GB", "country_name" => "United Kingdom", "currency" => "GBP",
          "job_titles" => [
            { "job_title" => "Recruiter", "headcount" => 1, "average_salary" => "70001.00",
              "min_salary" => "70001.00", "max_salary" => "70001.00" },
            { "job_title" => "Engineer", "headcount" => 2, "average_salary" => "55000.00",
              "min_salary" => "50000.00", "max_salary" => "60000.00" }
          ]
        )
      end

      it "returns 400 JSON when the country is missing" do
        get api_insights_by_job_title_path

        expect(response).to have_http_status(:bad_request)
        expect(json["error"]).to include("country")
      end

      it "returns 400 JSON for an unsupported country" do
        get api_insights_by_job_title_path(country: "XX")

        expect(response).to have_http_status(:bad_request)
        expect(json).to eq("error" => "Unsupported country: XX")
      end

      it "returns an empty list for a supported country without employees" do
        get api_insights_by_job_title_path(country: "JP")

        expect(response).to have_http_status(:ok)
        expect(json).to include("country_name" => "Japan", "currency" => "JPY", "job_titles" => [])
      end
    end

    describe "GET /api/insights/headcount" do
      it "returns headcount per country and department" do
        get api_insights_headcount_path

        expect(response).to have_http_status(:ok)
        expect(json["rows"]).to eq([
          { "country" => "IN", "country_name" => "India", "department" => "Engineering", "headcount" => 2 },
          { "country" => "GB", "country_name" => "United Kingdom", "department" => "Engineering", "headcount" => 2 },
          { "country" => "GB", "country_name" => "United Kingdom", "department" => "People", "headcount" => 1 }
        ])
      end
    end

    describe "GET /api/insights/usd_comparison" do
      it "returns each country's figures in approximate USD with the rate, source and date" do
        get api_insights_usd_comparison_path

        expect(response).to have_http_status(:ok)
        expect(json["rates_as_of"]).to eq("2026-10-22")
        expect(json["rates_source"]).to include("European Central Bank")
        expect(json["countries"]).to eq([
          { "country" => "GB", "country_name" => "United Kingdom", "currency" => "GBP", "usd_rate" => "0.7476",
            "headcount" => 3, "min_usd" => "66879.55", "max_usd" => "93632.71", "average_usd" => "80255.91" },
          { "country" => "IN", "country_name" => "India", "currency" => "INR", "usd_rate" => "94.8228",
            "headcount" => 2, "min_usd" => "10545.98", "max_usd" => "21091.97", "average_usd" => "15818.98" }
        ])
      end
    end

    it "returns empty lists when there are no employees" do
      Employee.delete_all

      get api_insights_by_country_path
      expect(json["countries"]).to eq([])

      get api_insights_headcount_path
      expect(json["rows"]).to eq([])

      get api_insights_usd_comparison_path
      expect(json["countries"]).to eq([])
    end
  end
end
