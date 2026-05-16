import { useState, useEffect } from "react";

export const CATEGORIES = {
  Food:          "#d4a843",
  Transport:     "#9b7fd4",
  Housing:       "#4caf8a",
  Entertainment: "#e07060",
  Health:        "#5ba8d4",
  Shopping:      "#e08860",
  Salary:        "#4caf8a",
  Subscriptions: "#c47fd4",
  Utilities:     "#7fb8d4",
  Other:         "#888",
};

const STORAGE_KEY = "budgetsage_transactions";

const SEEDS = [
  { id: "s1",  type: "income",  description: "Monthly salary",          amount: 4500, category: "Salary",        date: "2026-04-30" },
  { id: "s2",  type: "expense", description: "Rent",                    amount: 1200, category: "Housing",       date: "2026-05-01" },
  { id: "s3",  type: "expense", description: "Grocery run",             amount:   87, category: "Food",          date: "2026-05-02" },
  { id: "s4",  type: "expense", description: "Spotify",                 amount:   11, category: "Subscriptions", date: "2026-05-02" },
  { id: "s5",  type: "expense", description: "Bus pass",                amount:   45, category: "Transport",     date: "2026-05-03" },
  { id: "s6",  type: "expense", description: "Electric bill",           amount:   95, category: "Utilities",     date: "2026-05-04" },
  { id: "s7",  type: "expense", description: "Movie night",             amount:   28, category: "Entertainment", date: "2026-05-05" },
  { id: "s8",  type: "expense", description: "Pharmacy",                amount:   34, category: "Health",        date: "2026-05-06" },
  { id: "s9",  type: "expense", description: "New running shoes",       amount:  120, category: "Shopping",      date: "2026-05-07" },
  { id: "s10", type: "income",  description: "Freelance project payout", amount: 800, category: "Other",         date: "2026-05-08" },
];

export function useTransactions() {
  const [transactions, setTransactions] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch {
      // corrupted storage — fall through to seeds
    }
    return SEEDS;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
  }, [transactions]);

  function addTransaction({ type, description, amount, category, date }) {
    const tx = {
      id: crypto.randomUUID(),
      type,
      description,
      amount: Number(amount),
      category,
      date,
    };
    setTransactions((prev) => [tx, ...prev]);
  }

  function deleteTransaction(id) {
    setTransactions((prev) => prev.filter((tx) => tx.id !== id));
  }

  function importTransactions(array) {
    setTransactions((prev) => {
      const existingIds = new Set(prev.map((tx) => tx.id));
      const fresh = array.filter((tx) => !existingIds.has(tx.id));
      return [...prev, ...fresh];
    });
  }

  return { transactions, addTransaction, deleteTransaction, importTransactions };
}
