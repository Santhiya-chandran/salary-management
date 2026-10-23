module Seeds
  # Fixed lists the demo employee seed draws from. Illustrative values chosen
  # to look plausible, not market data. Hash order matters: the generator
  # walks these in order, so changing them changes the seeded employees.
  module EmployeeData
    # Share of employees per country, in percent (adds up to 100).
    COUNTRY_WEIGHTS = {
      "US" => 30, "IN" => 25, "GB" => 12, "DE" => 10,
      "FR" => 7, "CA" => 7, "AU" => 5, "JP" => 4
    }.freeze

    # Typical full-time salary for a job with multiplier 1.0, in local currency.
    REFERENCE_SALARIES = {
      "US" => BigDecimal("100000"),
      "IN" => BigDecimal("1800000"),
      "GB" => BigDecimal("60000"),
      "DE" => BigDecimal("65000"),
      "FR" => BigDecimal("55000"),
      "CA" => BigDecimal("90000"),
      "AU" => BigDecimal("110000"),
      "JP" => BigDecimal("7000000")
    }.freeze

    # Salaries are rounded to a multiple of this, in local currency.
    SALARY_ROUNDING = {
      "US" => 100, "IN" => 1_000, "GB" => 100, "DE" => 100,
      "FR" => 100, "CA" => 100, "AU" => 100, "JP" => 10_000
    }.freeze

    # Job titles per department, with a salary multiplier for each.
    DEPARTMENTS = {
      "Engineering" => {
        "Software Engineer" => BigDecimal("1.0"),
        "Senior Software Engineer" => BigDecimal("1.35"),
        "QA Engineer" => BigDecimal("0.85"),
        "Engineering Manager" => BigDecimal("1.7")
      },
      "Product" => {
        "Product Manager" => BigDecimal("1.25"),
        "Product Designer" => BigDecimal("1.0"),
        "UX Researcher" => BigDecimal("0.95")
      },
      "Sales" => {
        "Sales Development Representative" => BigDecimal("0.6"),
        "Account Executive" => BigDecimal("0.9"),
        "Sales Manager" => BigDecimal("1.3")
      },
      "Customer Support" => {
        "Support Specialist" => BigDecimal("0.6"),
        "Support Team Lead" => BigDecimal("0.8"),
        "Customer Success Manager" => BigDecimal("0.95")
      },
      "Finance" => {
        "Accountant" => BigDecimal("0.8"),
        "Financial Analyst" => BigDecimal("0.95"),
        "Finance Manager" => BigDecimal("1.4")
      },
      "People" => {
        "Recruiter" => BigDecimal("0.8"),
        "HR Generalist" => BigDecimal("0.75"),
        "HR Business Partner" => BigDecimal("1.1")
      },
      "Operations" => {
        "Operations Analyst" => BigDecimal("0.8"),
        "Office Manager" => BigDecimal("0.7"),
        "Head of Operations" => BigDecimal("1.8")
      }
    }.freeze

    # Share of each employment type, in percent (adds up to 100).
    EMPLOYMENT_TYPE_WEIGHTS = { "full_time" => 80, "part_time" => 12, "contractor" => 8 }.freeze

    # Part-time employees earn this percentage range of a full-time salary.
    PART_TIME_PERCENT = (50..80)

    # Random spread around the job's salary, in percent.
    SALARY_SPREAD_PERCENT = (80..120)

    # A fixed range, never Date.current, so the seed never changes over time.
    HIRE_DATES = (Date.new(2010, 1, 1)..Date.new(2026, 9, 30))

    NAMES = {
      "US" => {
        first: %w[James Mary Robert Patricia John Jennifer Michael Linda David Elizabeth William Barbara Daniel Susan Chris Jessica],
        last: %w[Smith Johnson Williams Brown Jones Garcia Miller Davis Rodriguez Martinez Wilson Anderson Taylor Thomas Moore Jackson]
      },
      "IN" => {
        first: %w[Aarav Priya Rohan Ananya Arjun Diya Vikram Kavya Rahul Sneha Aditya Isha Karan Meera Sanjay Pooja],
        last: %w[Sharma Patel Singh Kumar Gupta Reddy Iyer Nair Mehta Joshi Rao Das Chopra Verma Banerjee Pillai]
      },
      "GB" => {
        first: %w[Oliver Amelia George Isla Harry Ava Jack Emily Charlie Sophie Thomas Grace Alfie Lily Oscar Freya],
        last: %w[Smith Jones Taylor Brown Williams Wilson Johnson Davies Evans Thomas Roberts Walker Wright Thompson Hughes Clarke]
      },
      "DE" => {
        first: %w[Lukas Emma Leon Mia Finn Hannah Jonas Lea Paul Lena Felix Anna Elias Clara Noah Marie],
        last: %w[Müller Schmidt Schneider Fischer Weber Meyer Wagner Becker Schulz Hoffmann Koch Richter Klein Wolf Neumann Braun]
      },
      "FR" => {
        first: %w[Lucas Léa Hugo Chloé Louis Manon Jules Camille Arthur Inès Gabriel Sarah Raphaël Jade Adam Louise],
        last: %w[Martin Bernard Dubois Thomas Robert Richard Petit Durand Leroy Moreau Simon Laurent Lefebvre Michel Garcia Fournier]
      },
      "CA" => {
        first: %w[Liam Olivia Noah Emma Ethan Charlotte Benjamin Chloe Lucas Maya Nathan Ava Samuel Zoe Owen Leah],
        last: %w[Smith Tremblay Martin Roy Wilson Gagnon Brown MacDonald Lee Taylor Campbell Anderson Côté Bouchard Morin Young]
      },
      "AU" => {
        first: %w[Jack Charlotte William Olivia Oliver Mia Thomas Amelia Noah Isla Lachlan Chloe Cooper Ruby Hunter Zoe],
        last: %w[Smith Jones Williams Brown Wilson Taylor Nguyen Johnson Martin White Anderson Walker Thompson Ryan Kelly King]
      },
      "JP" => {
        first: %w[Haruto Yui Sota Hina Yuto Aoi Riku Sakura Kaito Mei Takumi Yuna Ren Rin Hiroshi Akari],
        last: %w[Sato Suzuki Takahashi Tanaka Watanabe Ito Yamamoto Nakamura Kobayashi Kato Yoshida Yamada Sasaki Yamaguchi Matsumoto Inoue]
      }
    }.freeze
  end
end
