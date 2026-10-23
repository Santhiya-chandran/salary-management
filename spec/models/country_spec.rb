require "rails_helper"

RSpec.describe Country do
  describe ".all" do
    it "lists the supported countries" do
      expect(described_class.all.map(&:code)).to contain_exactly("AU", "CA", "DE", "FR", "GB", "IN", "JP", "US")
    end

    it "gives every country a two-letter code, a name and a currency with a reference rate" do
      described_class.all.each do |country|
        expect(country.code).to match(/\A[A-Z]{2}\z/)
        expect(country.name).to be_present
        expect(described_class::EUR_REFERENCE_RATES).to have_key(country.currency)
      end
    end

    it "has no duplicate codes" do
      codes = described_class.all.map(&:code)

      expect(codes.uniq).to eq(codes)
    end
  end

  describe ".find" do
    it "returns the country for a code" do
      india = described_class.find("IN")

      expect(india.name).to eq("India")
      expect(india.currency).to eq("INR")
    end

    it "returns nil for an unsupported code" do
      expect(described_class.find("XX")).to be_nil
    end
  end

  describe ".codes" do
    it "returns the supported codes in alphabetical order" do
      expect(described_class.codes).to eq(%w[AU CA DE FR GB IN JP US])
    end
  end

  describe "#usd_rate" do
    it "is the units of local currency per 1 USD" do
      expect(described_class.find("US").usd_rate).to eq(1)
      expect(described_class.find("IN").usd_rate.round(4)).to eq(BigDecimal("94.8228"))
      expect(described_class.find("JP").usd_rate.round(4)).to eq(BigDecimal("157.046"))
    end

    it "is a BigDecimal, never a Float" do
      expect(described_class.find("GB").usd_rate).to be_a(BigDecimal)
    end
  end

  describe "#to_usd" do
    it "converts a local amount to USD, rounded to cents" do
      expect(described_class.find("IN").to_usd(BigDecimal("1000000"))).to eq(BigDecimal("10545.98"))
      expect(described_class.find("JP").to_usd(10_000_000)).to eq(BigDecimal("63675.63"))
      expect(described_class.find("DE").to_usd(BigDecimal("50000"))).to eq(BigDecimal("56025.00"))
    end

    it "leaves USD amounts unchanged" do
      expect(described_class.find("US").to_usd(BigDecimal("123456.78"))).to eq(BigDecimal("123456.78"))
    end

    it "returns a BigDecimal" do
      expect(described_class.find("FR").to_usd(BigDecimal("1"))).to be_a(BigDecimal)
    end

    it "refuses Float amounts, which can't represent money exactly" do
      expect { described_class.find("US").to_usd(0.1) }.to raise_error(ArgumentError, /Float/)
    end
  end

  it "records where the rates come from and their date" do
    expect(described_class::RATES_AS_OF).to eq(Date.new(2026, 10, 22))
    expect(described_class::RATES_SOURCE).to include("European Central Bank")
  end
end
