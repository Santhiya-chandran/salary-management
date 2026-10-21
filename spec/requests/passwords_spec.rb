require "rails_helper"

# Password reset is out of scope for v1 (see docs/decisions.md), so its
# generated routes must not exist.
RSpec.describe "Password reset", type: :request do
  it "is not routable" do
    get "/passwords/new"

    expect(response).to have_http_status(:not_found)
  end
end
