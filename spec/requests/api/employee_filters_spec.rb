require "rails_helper"

RSpec.describe "GET /api/employees/filters", type: :request do
  it "returns 401 JSON when not logged in" do
    get filters_api_employees_path

    expect(response).to have_http_status(:unauthorized)
  end

  it "returns the options for the list filters and the employee form" do
    sign_in(create(:user))
    create(:employee, department: "Engineering", job_title: "Software Engineer")

    get filters_api_employees_path

    expect(response).to have_http_status(:ok)
    body = response.parsed_body
    expect(body["countries"]).to include({ "code" => "GB", "name" => "United Kingdom", "currency" => "GBP" })
    expect(body["departments"]).to eq([ "Engineering" ])
    expect(body["job_titles"]).to eq([ "Software Engineer" ])
    expect(body["employment_types"]).to eq(%w[full_time part_time contractor])
  end

  it "is not mistaken for an employee id" do
    sign_in(create(:user))

    get "/api/employees/filters"

    expect(response).to have_http_status(:ok)
    expect(response.parsed_body).to have_key("countries")
  end
end
