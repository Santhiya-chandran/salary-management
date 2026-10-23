require "rails_helper"

RSpec.describe DecimalFormat do
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

    it "rounds an exact average such as 60000.333…" do
      expect(described_class.money(BigDecimal("180001") / 3)).to eq("60000.33")
    end
  end

  describe ".fixed" do
    it "shows the requested number of decimal places" do
      expect(described_class.fixed(BigDecimal("94.82285"), places: 4)).to eq("94.8229")
      expect(described_class.fixed(BigDecimal("1"), places: 4)).to eq("1.0000")
    end
  end

  it "refuses Float, which can't hold money exactly" do
    expect { described_class.money(0.1) }.to raise_error(ArgumentError, /Float/)
  end
end
