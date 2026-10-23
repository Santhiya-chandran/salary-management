require "rails_helper"

RSpec.describe Employees::FilterOptionsQuery do
  it "lists every supported country with its name and currency, whether or not it has employees" do
    result = described_class.call

    expect(result[:countries].size).to eq(Country.all.size)
    expect(result[:countries]).to include({ code: "IN", name: "India", currency: "INR" })
  end

  it "sorts countries by name" do
    names = described_class.call[:countries].map { |country| country[:name] }

    expect(names).to eq(names.sort)
  end

  it "lists each department and job title once, sorted ignoring case" do
    create(:employee, department: "sales", job_title: "Account Executive")
    create(:employee, department: "Engineering", job_title: "software engineer")
    create(:employee, department: "Engineering", job_title: "Account Executive")
    create(:employee, department: "People", job_title: "Recruiter")

    result = described_class.call

    expect(result[:departments]).to eq(%w[Engineering People sales])
    expect(result[:job_titles]).to eq([ "Account Executive", "Recruiter", "software engineer" ])
  end

  it "returns empty department and job title lists when there are no employees" do
    result = described_class.call

    expect(result[:departments]).to eq([])
    expect(result[:job_titles]).to eq([])
  end

  it "lists the allowed employment types" do
    expect(described_class.call[:employment_types]).to eq(%w[full_time part_time contractor])
  end
end
