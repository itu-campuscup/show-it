"use client";

import styles from "@/app/page.module.css";

type YearSelectorProps = {
  selectedYear: number;
  availableYears: readonly number[];
};

export function YearSelector({ selectedYear, availableYears }: YearSelectorProps) {
  return (
    <form className={styles.yearSelector} method="get">
      <label htmlFor="ranking-year">Year</label>
      <select id="ranking-year" className={styles.yearControl} name="year" value={selectedYear} onChange={(event) => event.currentTarget.form?.requestSubmit()}>
        {availableYears.map((year) => <option key={year} value={year}>{year}</option>)}
      </select>
    </form>
  );
}
