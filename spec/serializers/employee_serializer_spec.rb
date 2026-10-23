require "rails_helper"

RSpec.describe EmployeeSerializer do
  describe ".money" do
    it "always shows two decimal places" do
      expect(described_class.money(BigDecimal("100"))).to eq("100.00")
      expect(described_class.money(BigDecimal("0.5"))).to eq("0.50")
      expect(described_class.money(BigDecimal("85000.25"))).to eq("85000.25")
    end

    it "keeps large salaries exact" do
      expect(described_class.money(BigDecimal("9999999999999.99"))).to eq("9999999999999.99")
    end

    it "rounds half up to cents" do
      expect(described_class.money(BigDecimal("1.005"))).to eq("1.01")
    end
  end
end
