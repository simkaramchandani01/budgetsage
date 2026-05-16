import { useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Wallet, Percent, X } from "lucide-react";
import { useTransactions } from "../data/store.js";
import {
  getTotalIncome, getTotalExpenses, getNetBalance,
  getSavingsRate, getByCategory, getYearlyTrend, getAvailableYears,
} from "../data/stats.js";

const fmt = (n) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);

const fmtDate = (d) =>
  new Date(d + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });

function LineTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="dash-tooltip">
      <div className="dash-tooltip-label">{label}</div>
      {payload.map((p) => (
        <div key={p.dataKey} className="dash-tooltip-row">
          <span className="dash-tooltip-swatch" style={{ background: p.color }} />
          <span className="dash-tooltip-name">{p.name}</span>
          <span className="dash-tooltip-val">{fmt(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

function PieTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="dash-tooltip">
      <div className="dash-tooltip-label">{payload[0].name}</div>
      <div className="dash-tooltip-val">{fmt(payload[0].value)}</div>
    </div>
  );
}

export default function Dashboard() {
  const { transactions } = useTransactions();
  const years = getAvailableYears(transactions);
  const [year, setYear] = useState(years[0]);
  const [selectedCategory, setSelectedCategory] = useState(null);

  const yearTxs    = transactions.filter((t) => t.date.startsWith(String(year)));
  const income     = getTotalIncome(yearTxs);
  const expenses   = getTotalExpenses(yearTxs);
  const net        = getNetBalance(yearTxs);
  const savings    = getSavingsRate(yearTxs);
  const trend      = getYearlyTrend(transactions, year);
  const byCategory = getByCategory(yearTxs);

  const yearIdx = years.indexOf(year);
  const canPrev = yearIdx < years.length - 1;
  const canNext = yearIdx > 0;

  function changeYear(newYear) {
    setYear(newYear);
    setSelectedCategory(null);
  }

  function toggleCategory(name) {
    setSelectedCategory((prev) => (prev === name ? null : name));
  }

  const drillTxs = selectedCategory
    ? yearTxs
        .filter((t) => t.type === "expense" && t.category === selectedCategory)
        .sort((a, b) => b.date.localeCompare(a.date))
    : [];

  const drillTotal = drillTxs.reduce((s, t) => s + t.amount, 0);
  const selectedCat = byCategory.find((c) => c.name === selectedCategory);

  return (
    <>
      <style>{styles}</style>
      <div className="dash-root">

        <div className="dash-header">
          <h1 className="dash-title">Dashboard</h1>
          <div className="dash-year-nav">
            <button
              className="dash-year-btn"
              onClick={() => changeYear(years[yearIdx + 1])}
              disabled={!canPrev}
              aria-label="Previous year"
            >
              <ChevronLeft size={15} />
            </button>
            <span className="dash-year-label">{year}</span>
            <button
              className="dash-year-btn"
              onClick={() => changeYear(years[yearIdx - 1])}
              disabled={!canNext}
              aria-label="Next year"
            >
              <ChevronRight size={15} />
            </button>
          </div>
        </div>

        <div className="dash-cards">
          <div className="dash-card">
            <div className="dash-card-label"><TrendingUp size={12} />Income</div>
            <div className="dash-card-value clr-gold">{fmt(income)}</div>
          </div>
          <div className="dash-card">
            <div className="dash-card-label"><TrendingDown size={12} />Expenses</div>
            <div className="dash-card-value clr-expense">{fmt(expenses)}</div>
          </div>
          <div className="dash-card">
            <div className="dash-card-label"><Wallet size={12} />Net Balance</div>
            <div className={`dash-card-value ${net >= 0 ? "clr-income" : "clr-expense"}`}>
              {fmt(net)}
            </div>
          </div>
          <div className="dash-card">
            <div className="dash-card-label"><Percent size={12} />Savings Rate</div>
            <div className="dash-card-value clr-income">{savings.toFixed(1)}%</div>
          </div>
        </div>

        <div className="dash-section">
          <div className="dash-section-title">Monthly Overview</div>
          <div className="dash-chart-wrap">
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={trend}>
                <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#666", fontSize: 12 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#666", fontSize: 12 }}
                  tickFormatter={(v) => v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v}`}
                  width={46}
                />
                <Tooltip
                  content={<LineTooltip />}
                  cursor={{ stroke: "rgba(255,255,255,0.08)", strokeWidth: 1 }}
                />
                <Line
                  dataKey="income"
                  name="Income"
                  type="monotone"
                  stroke="#4caf8a"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: "#4caf8a", strokeWidth: 0 }}
                />
                <Line
                  dataKey="expenses"
                  name="Expenses"
                  type="monotone"
                  stroke="#e07060"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: "#e07060", strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {byCategory.length > 0 && (
          <div className="dash-section">
            <div className="dash-section-title">Spending by Category</div>
            <div className="dash-cat-wrap">

              <div className="dash-pie-wrap">
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={byCategory}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={58}
                      outerRadius={92}
                      paddingAngle={2}
                      onClick={(data) => toggleCategory(data.name)}
                      style={{ cursor: "pointer" }}
                    >
                      {byCategory.map((entry) => (
                        <Cell
                          key={entry.name}
                          fill={entry.color}
                          opacity={selectedCategory && selectedCategory !== entry.name ? 0.25 : 1}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<PieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="dash-cat-list">
                {byCategory.map((cat) => {
                  const pct = expenses > 0 ? (cat.value / expenses) * 100 : 0;
                  const isSelected = selectedCategory === cat.name;
                  return (
                    <div
                      key={cat.name}
                      className={`dash-cat-row${isSelected ? " dash-cat-row--selected" : ""}`}
                      onClick={() => toggleCategory(cat.name)}
                    >
                      <div className="dash-cat-meta">
                        <span className="dash-cat-dot" style={{ background: cat.color }} />
                        <span className="dash-cat-name">{cat.name}</span>
                        <span className="dash-cat-amt">{fmt(cat.value)}</span>
                      </div>
                      <div className="dash-cat-bar-track">
                        <div
                          className="dash-cat-bar-fill"
                          style={{ width: `${pct.toFixed(1)}%`, background: cat.color }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>

            {selectedCategory && (
              <div className="dash-drill">
                <div className="dash-drill-header">
                  <div className="dash-drill-title">
                    <span className="dash-drill-dot" style={{ background: selectedCat?.color }} />
                    {selectedCategory}
                  </div>
                  <button className="dash-drill-close" onClick={() => setSelectedCategory(null)}>
                    <X size={14} />
                  </button>
                </div>

                {drillTxs.length === 0 ? (
                  <div className="dash-drill-empty">No transactions found</div>
                ) : (
                  <div className="dash-drill-list">
                    {drillTxs.map((t) => (
                      <div key={t.id} className="dash-drill-row">
                        <span className="dash-drill-date">{fmtDate(t.date)}</span>
                        <span className="dash-drill-desc">{t.description}</span>
                        <span className="dash-drill-amt">{fmt(t.amount)}</span>
                      </div>
                    ))}
                    <div className="dash-drill-total">
                      <span>Total</span>
                      <span>{fmt(drillTotal)}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>
        )}

      </div>
    </>
  );
}

const styles = `
  .dash-root {
    max-width: 900px;
  }

  .dash-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 28px;
  }

  .dash-title {
    font-family: Georgia, "Times New Roman", serif;
    font-size: 26px;
    font-weight: 700;
    color: #f0ece4;
    margin: 0;
    letter-spacing: -0.4px;
  }

  .dash-year-nav {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .dash-year-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    background: #1a1816;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 8px;
    color: #f0ece4;
    cursor: pointer;
    transition: background 0.15s;
  }

  .dash-year-btn:disabled {
    opacity: 0.25;
    cursor: not-allowed;
  }

  .dash-year-btn:not(:disabled):hover {
    background: rgba(255, 255, 255, 0.07);
  }

  .dash-year-label {
    font-size: 17px;
    font-weight: 600;
    color: #f0ece4;
    min-width: 48px;
    text-align: center;
  }

  .dash-cards {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
    margin-bottom: 28px;
  }

  .dash-card {
    background: #1a1816;
    border-radius: 14px;
    padding: 16px 18px;
  }

  .dash-card-label {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 10px;
    color: #666;
    text-transform: uppercase;
    letter-spacing: 0.6px;
    margin-bottom: 9px;
  }

  .dash-card-value {
    font-size: 20px;
    font-weight: 700;
    letter-spacing: -0.5px;
  }

  .clr-gold    { color: #d4a843; }
  .clr-income  { color: #4caf8a; }
  .clr-expense { color: #e07060; }

  .dash-section {
    margin-bottom: 28px;
  }

  .dash-section-title {
    font-size: 11px;
    font-weight: 600;
    color: #666;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    margin-bottom: 12px;
  }

  .dash-chart-wrap {
    background: #1a1816;
    border-radius: 14px;
    padding: 20px 12px 8px;
  }

  .dash-tooltip {
    background: #252220;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    padding: 10px 13px;
  }

  .dash-tooltip-label {
    font-size: 11px;
    color: #888;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 7px;
  }

  .dash-tooltip-row {
    display: flex;
    align-items: center;
    gap: 7px;
    margin-top: 4px;
  }

  .dash-tooltip-swatch {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .dash-tooltip-name {
    flex: 1;
    font-size: 12px;
    color: #a09890;
  }

  .dash-tooltip-val {
    font-size: 13px;
    font-weight: 600;
    color: #f0ece4;
  }

  .dash-cat-wrap {
    display: flex;
    gap: 8px;
    background: #1a1816;
    border-radius: 14px;
    padding: 20px 20px 20px 12px;
    align-items: center;
    margin-bottom: 10px;
  }

  .dash-pie-wrap {
    width: 200px;
    flex-shrink: 0;
  }

  .dash-cat-list {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .dash-cat-row {
    padding: 7px 8px;
    border-radius: 8px;
    cursor: pointer;
    transition: background 0.12s;
  }

  .dash-cat-row:hover {
    background: rgba(255, 255, 255, 0.05);
  }

  .dash-cat-row--selected {
    background: rgba(212, 168, 67, 0.08);
  }

  .dash-cat-row--selected:hover {
    background: rgba(212, 168, 67, 0.12);
  }

  .dash-cat-meta {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 5px;
  }

  .dash-cat-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .dash-cat-name {
    flex: 1;
    font-size: 13px;
    color: #f0ece4;
  }

  .dash-cat-amt {
    font-size: 13px;
    font-weight: 600;
    color: #f0ece4;
  }

  .dash-cat-bar-track {
    height: 4px;
    background: rgba(255, 255, 255, 0.06);
    border-radius: 2px;
    overflow: hidden;
  }

  .dash-cat-bar-fill {
    height: 100%;
    border-radius: 2px;
    transition: width 0.4s ease;
  }

  /* Drill-down panel */
  .dash-drill {
    background: #1a1816;
    border-radius: 14px;
    overflow: hidden;
  }

  .dash-drill-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 16px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  }

  .dash-drill-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    font-weight: 600;
    color: #f0ece4;
  }

  .dash-drill-dot {
    width: 9px;
    height: 9px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .dash-drill-close {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 26px;
    height: 26px;
    background: transparent;
    border: none;
    color: #666;
    cursor: pointer;
    border-radius: 6px;
    transition: background 0.12s, color 0.12s;
  }

  .dash-drill-close:hover {
    background: rgba(255, 255, 255, 0.06);
    color: #f0ece4;
  }

  .dash-drill-list {
    padding: 4px 0;
  }

  .dash-drill-row {
    display: grid;
    grid-template-columns: 56px 1fr auto;
    align-items: center;
    gap: 12px;
    padding: 9px 16px;
    transition: background 0.1s;
  }

  .dash-drill-row:hover {
    background: rgba(255, 255, 255, 0.03);
  }

  .dash-drill-date {
    font-size: 12px;
    color: #666;
    white-space: nowrap;
  }

  .dash-drill-desc {
    font-size: 13px;
    color: #f0ece4;
  }

  .dash-drill-amt {
    font-size: 13px;
    font-weight: 600;
    color: #e07060;
  }

  .dash-drill-total {
    display: flex;
    justify-content: space-between;
    padding: 10px 16px;
    margin-top: 2px;
    border-top: 1px solid rgba(255, 255, 255, 0.06);
    font-size: 13px;
    font-weight: 600;
    color: #a09890;
  }

  .dash-drill-empty {
    padding: 20px 16px;
    font-size: 13px;
    color: #555;
  }
`;
