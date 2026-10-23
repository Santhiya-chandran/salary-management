require "rails_helper"

RSpec.describe "Employee API: show, create, update, delete", type: :request do
  let(:user) { create(:user) }
  let(:valid_attributes) do
    {
      full_name: "Ada Lovelace",
      job_title: "Engineer",
      department: "R&D",
      country: "GB",
      currency: "GBP",
      salary: "85000.50",
      employment_type: "full_time",
      hire_date: "2023-04-01"
    }
  end

  def json
    response.parsed_body
  end

  context "when not logged in" do
    let(:employee) { create(:employee) }

    it "returns 401 for every action" do
      get api_employee_path(employee)
      expect(response).to have_http_status(:unauthorized)

      post api_employees_path, params: { employee: valid_attributes }, as: :json
      expect(response).to have_http_status(:unauthorized)

      patch api_employee_path(employee), params: { employee: { salary: "1" } }, as: :json
      expect(response).to have_http_status(:unauthorized)

      delete api_employee_path(employee)
      expect(response).to have_http_status(:unauthorized)

      expect(employee.reload.salary).to eq(BigDecimal("100000"))
    end
  end

  context "when logged in" do
    before { sign_in(user) }

    describe "GET /api/employees/:id" do
      it "returns the employee" do
        employee = create(:employee, full_name: "Grace Hopper")

        get api_employee_path(employee)

        expect(response).to have_http_status(:ok)
        expect(json.dig("employee", "full_name")).to eq("Grace Hopper")
        expect(json.dig("employee", "id")).to eq(employee.id)
      end

      it "returns 404 JSON for an unknown id" do
        get api_employee_path(id: 0)

        expect(response).to have_http_status(:not_found)
        expect(json).to eq("error" => "Not found.")
      end
    end

    describe "POST /api/employees" do
      it "creates the employee and returns it with 201" do
        expect {
          post api_employees_path, params: { employee: valid_attributes }, as: :json
        }.to change(Employee, :count).by(1)

        expect(response).to have_http_status(:created)
        expect(json["employee"]).to include(
          "full_name" => "Ada Lovelace", "country" => "GB", "currency" => "GBP",
          "salary" => "85000.50", "employment_type" => "full_time", "hire_date" => "2023-04-01"
        )
        expect(Employee.last.salary).to eq(BigDecimal("85000.50"))
      end

      it "returns 422 with errors per field and creates nothing" do
        expect {
          post api_employees_path,
            params: { employee: valid_attributes.merge(salary: "0", currency: "USD", full_name: "") },
            as: :json
        }.not_to change(Employee, :count)

        expect(response).to have_http_status(:unprocessable_content)
        expect(json["errors"]).to eq(
          "full_name" => [ "can't be blank" ],
          "salary" => [ "must be greater than 0" ],
          "currency" => [ "must be GBP for United Kingdom" ]
        )
      end

      it "reports a non-numeric salary and an unknown employment type as validation errors" do
        post api_employees_path,
          params: { employee: valid_attributes.merge(salary: "lots", employment_type: "intern") },
          as: :json

        expect(response).to have_http_status(:unprocessable_content)
        expect(json["errors"]).to include(
          "salary" => [ "is not a number" ],
          "employment_type" => [ "is not included in the list" ]
        )
      end

      it "ignores attributes that can't be set through the API" do
        post api_employees_path, params: { employee: valid_attributes.merge(id: 999_999, created_at: "2000-01-01") }, as: :json

        expect(response).to have_http_status(:created)
        expect(Employee.last.id).not_to eq(999_999)
        expect(Employee.last.created_at.year).not_to eq(2000)
      end

      it "returns 400 JSON when the employee key is missing" do
        post api_employees_path, params: { full_name: "No wrapper" }, as: :json

        expect(response).to have_http_status(:bad_request)
        expect(json["error"]).to include("employee")
      end
    end

    describe "PATCH /api/employees/:id" do
      let!(:employee) { create(:employee, salary: BigDecimal("100000"), job_title: "Engineer") }

      it "updates only the given fields, including the current salary" do
        patch api_employee_path(employee), params: { employee: { salary: "120000.25" } }, as: :json

        expect(response).to have_http_status(:ok)
        expect(json.dig("employee", "salary")).to eq("120000.25")
        expect(employee.reload.salary).to eq(BigDecimal("120000.25"))
        expect(employee.job_title).to eq("Engineer")
      end

      it "returns 422 and leaves the employee unchanged when invalid" do
        patch api_employee_path(employee), params: { employee: { salary: "-5" } }, as: :json

        expect(response).to have_http_status(:unprocessable_content)
        expect(json["errors"]).to eq("salary" => [ "must be greater than 0" ])
        expect(employee.reload.salary).to eq(BigDecimal("100000"))
      end

      it "returns 404 JSON for an unknown id" do
        patch api_employee_path(id: 0), params: { employee: { salary: "1" } }, as: :json

        expect(response).to have_http_status(:not_found)
      end
    end

    describe "DELETE /api/employees/:id" do
      it "deletes the employee and returns 204" do
        employee = create(:employee)

        expect { delete api_employee_path(employee) }.to change(Employee, :count).by(-1)
        expect(response).to have_http_status(:no_content)
      end

      it "returns 404 JSON for an unknown id" do
        delete api_employee_path(id: 0)

        expect(response).to have_http_status(:not_found)
      end
    end

    # The test environment turns CSRF protection off, so turn it on (after the
    # outer sign_in) to check that API writes need the token the React app sends.
    describe "CSRF protection" do
      before { ActionController::Base.allow_forgery_protection = true }
      after { ActionController::Base.allow_forgery_protection = false }

      def csrf_token
        get root_path
        Nokogiri::HTML(response.body).at("meta[name=csrf-token]")["content"]
      end

      it "rejects a write without the X-CSRF-Token header with 403 JSON" do
        expect {
          post api_employees_path, params: { employee: valid_attributes }, as: :json
        }.not_to change(Employee, :count)

        expect(response).to have_http_status(:forbidden)
        expect(json).to eq("error" => "Invalid or missing CSRF token.")
      end

      it "accepts a write with the token from the page's meta tag" do
        token = csrf_token

        post api_employees_path, params: { employee: valid_attributes }, as: :json,
          headers: { "X-CSRF-Token" => token }

        expect(response).to have_http_status(:created)
      end
    end
  end
end
