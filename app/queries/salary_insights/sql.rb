module SalaryInsights
  # SQL fragments shared by the insight queries.
  module Sql
    # Median salary within each GROUP BY group, as an exact numeric.
    # PERCENTILE_CONT would return double precision (a float), so instead
    # PERCENTILE_DISC picks real values from the column: ascending it gives the
    # lower middle salary, descending the upper one. Their average is the
    # middle salary for an odd count and the mean of the two middle salaries
    # for an even count.
    MEDIAN_SALARY = Arel.sql(<<~SQL.squish)
      (PERCENTILE_DISC(0.5) WITHIN GROUP (ORDER BY salary ASC)
        + PERCENTILE_DISC(0.5) WITHIN GROUP (ORDER BY salary DESC)) / 2
    SQL
  end
end
