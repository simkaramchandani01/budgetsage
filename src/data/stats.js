import { CATEGORIES } from "./store.js";

export function getTotalIncome(txs) {
  return txs
    .filter(t => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);
}

export function getTotalExpenses(txs) {
  return txs
    .filter(t => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);
}

export function getNetBalance(txs) {
  return getTotalIncome(txs) - getTotalExpenses(txs);
}

export function getSavingsRate(txs) {
  const income = getTotalIncome(txs);
  if (income === 0) return 0;
  return Math.max(0, ((income - getTotalExpenses(txs)) / income) * 100);
}

export function getByCategory(txs) {
  const totals = {};
  txs
    .filter(t => t.type === "expense")
    .forEach(t => {
      totals[t.category] = (totals[t.category] ?? 0) + t.amount;
    });
  return Object.entries(totals)
    .map(([name, value]) => ({ name, value, color: CATEGORIES[name] ?? "#888888" }))
    .sort((a, b) => b.value - a.value);
}

export function getMonthlyTrend(txs) {
  const now = new Date();
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
    return {
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      month: d.toLocaleString("en", { month: "short" }),
      income: 0,
      expenses: 0,
    };
  });

  const index = Object.fromEntries(months.map((m, i) => [m.key, i]));

  txs.forEach(t => {
    const key = t.date.slice(0, 7);
    if (key in index) {
      const m = months[index[key]];
      if (t.type === "income") m.income += t.amount;
      else m.expenses += t.amount;
    }
  });

  return months.map(({ month, income, expenses }) => ({ month, income, expenses }));
}

export function getYearlyTrend(txs, year) {
  const months = Array.from({ length: 12 }, (_, i) => ({
    month: new Date(year, i, 1).toLocaleString("en", { month: "short" }),
    income: 0,
    expenses: 0,
  }));
  txs.forEach(t => {
    if (!t.date.startsWith(String(year))) return;
    const m = months[parseInt(t.date.slice(5, 7), 10) - 1];
    if (t.type === "income") m.income += t.amount;
    else m.expenses += t.amount;
  });
  return months;
}

export function getAvailableYears(txs) {
  const years = new Set(txs.map(t => parseInt(t.date.slice(0, 4), 10)));
  years.add(new Date().getFullYear());
  return Array.from(years).sort((a, b) => b - a);
}

export function getTopMerchants(txs, limit = 5) {
  const map = {};
  txs
    .filter(t => t.type === "expense")
    .forEach(t => {
      if (!map[t.description])
        map[t.description] = { description: t.description, total: 0, count: 0 };
      map[t.description].total += t.amount;
      map[t.description].count += 1;
    });
  return Object.values(map)
    .sort((a, b) => b.total - a.total)
    .slice(0, limit);
}
