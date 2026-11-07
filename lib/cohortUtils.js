function mondayOf(dateStr) {
  const d = new Date(String(dateStr).slice(0, 10) + "T00:00:00Z");
  const day = d.getUTCDay();
  d.setUTCDate(d.getUTCDate() + (day === 0 ? -6 : 1 - day));
  return d;
}

export function getWeekNumber(weekStart, cohort) {
  const base = mondayOf(cohort?.start_date ?? weekStart);
  const current = new Date(String(weekStart).slice(0, 10) + "T00:00:00Z");
  const diff = Math.round((current - base) / (7 * 24 * 60 * 60 * 1000));
  return diff + (cohort?.first_week_number ?? 1);
}