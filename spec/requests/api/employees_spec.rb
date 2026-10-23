require "rails_helper"

RSpec.describe "GET /api/employees", type: :request do
  def json
    response.parsed_body
  end

  context "when not logged in" do
    it "returns 401 JSON instead of redirecting to the login page" do
      get api_employees_path

      expect(response).to have_http_status(:unauthorized)
      expect(response.media_type).to eq("application/json")
      expect(json).to eq("error" => "You need to sign in.")
    end
  end

  context "when logged in" do
    let(:user) { create(:user) }

    before { sign_in(user) }

    it "returns employees with all their fields and pagination details" do
      employee = create(:employee,
        full_name: "Ada Lovelace", job_title: "Engineer", department: "R&D",
        country: "GB", currency: "GBP", salary: BigDecimal("85000.50"),
        employment_type: "part_time", hire_date: Date.new(2023, 4, 1))

      get api_employees_path

      expect(response).to have_http_status(:ok)
      expect(json["employees"]).to eq([ {
        "id" => employee.id,
        "full_name" => "Ada Lovelace",
        "job_title" => "Engineer",
        "department" => "R&D",
        "country" => "GB",
        "country_name" => "United Kingdom",
        "currency" => "GBP",
        "salary" => "85000.50",
        "employment_type" => "part_time",
        "hire_date" => "2023-04-01"
      } ])
      expect(json["meta"]).to eq("page" => 1, "per_page" => 25, "total_count" => 1, "total_pages" => 1)
    end

    it "sends salaries as strings with two decimals, so no precision is lost" do
      create(:employee, full_name: "A", salary: BigDecimal("9999999999999.99"))
      create(:employee, full_name: "B", salary: BigDecimal("42"))

      get api_employees_path

      expect(json["employees"].map { |e| e["salary"] }).to eq([ "9999999999999.99", "42.00" ])
    end

    it "applies search, filters, sorting and paging from the query string" do
      create(:employee, full_name: "Ana Low", country: "IN", currency: "INR", department: "Sales", salary: 100)
      create(:employee, full_name: "Ana High", country: "IN", currency: "INR", department: "Sales", salary: 300)
      create(:employee, full_name: "Ana Mid", country: "IN", currency: "INR", department: "Sales", salary: 200)
      create(:employee, full_name: "Ana Elsewhere", country: "US", currency: "USD", department: "Sales")

      get api_employees_path, params: {
        search: "ana", country: "IN", department: "Sales",
        sort: "salary", direction: "desc", page: 2, per_page: 2
      }

      expect(json["employees"].map { |e| e["full_name"] }).to eq([ "Ana Low" ])
      expect(json["meta"]).to eq("page" => 2, "per_page" => 2, "total_count" => 3, "total_pages" => 2)
    end

    it "falls back to defaults for invalid sorting and paging values" do
      create(:employee)

      get api_employees_path, params: { sort: "password_digest", direction: "up", page: "x", per_page: "-5" }

      expect(response).to have_http_status(:ok)
      expect(json["meta"]).to include("page" => 1, "per_page" => 25)
    end

    it "returns an empty list when nothing matches" do
      get api_employees_path, params: { search: "nobody" }

      expect(json["employees"]).to eq([])
      expect(json["meta"]).to include("total_count" => 0, "total_pages" => 0)
    end
  end
end
