import { useState } from "react";
import { LayoutDashboard, Receipt, Tag, Plus, Upload } from "lucide-react";
import { useTransactions } from "../data/store.js";
import { getNetBalance, getTotalIncome, getTotalExpenses } from "../data/stats.js";
import AddTransactionModal from "./AddTransactionModal";
import ImportModal from "./ImportModal";

const NAV_ITEMS = [
  { label: "Dashboard",    href: "/",             Icon: LayoutDashboard },
  { label: "Transactions", href: "/transactions", Icon: Receipt },
  { label: "Categories",   href: "/categories",   Icon: Tag },
];

const fmt = (n) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

export default function Layout({ children }) {
  const { transactions, addTransaction, importTransactions } = useTransactions();
  const [showAddModal, setShowAddModal]       = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  const pathname = window.location.pathname;
  const netBalance = getNetBalance(transactions);
  const income     = getTotalIncome(transactions);
  const expenses   = getTotalExpenses(transactions);

  return (
    <>
      <style>{styles}</style>
      <div className="layout-root">
        <aside className="layout-sidebar">
          <div className="layout-brand">
            <div className="layout-brand-name">BudgetSage</div>
            <div className="layout-brand-sub">AI Finance Coach</div>
          </div>

          <nav className="layout-nav">
            {NAV_ITEMS.map(({ label, href, Icon }) => (
              <a
                key={href}
                href={href}
                className={`layout-nav-link${pathname === href ? " active" : ""}`}
              >
                <Icon size={16} strokeWidth={1.8} />
                {label}
              </a>
            ))}
          </nav>

          <div className="layout-spacer" />

          <div className="layout-summary">
            <div className="layout-summary-card">
              <div className="layout-summary-label">Net Balance</div>
              <div className={`layout-summary-value ${netBalance >= 0 ? "clr-income" : "clr-expense"}`}>
                {fmt(netBalance)}
              </div>
            </div>
            <div className="layout-summary-card">
              <div className="layout-summary-label">Income</div>
              <div className="layout-summary-value clr-gold">{fmt(income)}</div>
            </div>
            <div className="layout-summary-card">
              <div className="layout-summary-label">Expenses</div>
              <div className="layout-summary-value clr-expense">{fmt(expenses)}</div>
            </div>
          </div>

          <button className="layout-add-btn" onClick={() => setShowAddModal(true)}>
            <Plus size={15} strokeWidth={2.5} />
            Add Transaction
          </button>
          <button className="layout-import-btn" onClick={() => setShowImportModal(true)}>
            <Upload size={14} strokeWidth={2} />
            Import Wallet
          </button>
        </aside>

        <main className="layout-main">{children}</main>
      </div>

      <AddTransactionModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={addTransaction}
      />
      <ImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={importTransactions}
      />
    </>
  );
}

const styles = `
  .layout-root {
    display: flex;
    min-height: 100vh;
    background: #0f0e0d;
    color: #f0ece4;
    font-family: "DM Sans", sans-serif;
  }

  .layout-sidebar {
    width: 240px;
    flex-shrink: 0;
    background: #1a1816;
    border-right: 1px solid rgba(255, 255, 255, 0.05);
    display: flex;
    flex-direction: column;
    padding: 28px 16px 20px;
    position: sticky;
    top: 0;
    height: 100vh;
    overflow-y: auto;
    box-sizing: border-box;
  }

  .layout-main {
    flex: 1;
    overflow-y: auto;
    padding: 32px;
    box-sizing: border-box;
  }

  /* Brand */
  .layout-brand {
    padding: 0 4px;
  }

  .layout-brand-name {
    font-family: Georgia, "Times New Roman", serif;
    font-size: 22px;
    color: #d4a843;
    font-weight: 700;
    line-height: 1;
    letter-spacing: -0.3px;
  }

  .layout-brand-sub {
    font-size: 11px;
    color: #666;
    margin-top: 5px;
    letter-spacing: 0.3px;
  }

  /* Nav */
  .layout-nav {
    margin-top: 36px;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .layout-nav-link {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
    border-radius: 8px;
    text-decoration: none;
    color: #a09890;
    font-size: 14px;
    transition: background 0.15s, color 0.15s;
  }

  .layout-nav-link:hover {
    background: rgba(255, 255, 255, 0.05);
    color: #f0ece4;
  }

  .layout-nav-link.active {
    background: rgba(212, 168, 67, 0.12);
    color: #d4a843;
  }

  /* Spacer */
  .layout-spacer {
    flex: 1;
    min-height: 24px;
  }

  /* Summary cards */
  .layout-summary {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 14px;
  }

  .layout-summary-card {
    background: #0f0e0d;
    border-radius: 10px;
    padding: 10px 13px;
  }

  .layout-summary-label {
    font-size: 10px;
    color: #666;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 3px;
  }

  .layout-summary-value {
    font-size: 15px;
    font-weight: 600;
    letter-spacing: -0.2px;
  }

  /* Color utilities */
  .clr-gold    { color: #d4a843; }
  .clr-income  { color: #4caf8a; }
  .clr-expense { color: #e07060; }

  /* Add button */
  .layout-add-btn {
    width: 100%;
    padding: 11px;
    background: #d4a843;
    color: #0f0e0d;
    border: none;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 600;
    font-family: inherit;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    transition: opacity 0.15s;
  }

  .layout-add-btn:hover {
    opacity: 0.88;
  }

  .layout-import-btn {
    width: 100%;
    margin-top: 8px;
    padding: 10px;
    background: transparent;
    color: #a09890;
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 10px;
    font-size: 13.5px;
    font-weight: 500;
    font-family: inherit;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    transition: border-color 0.15s, color 0.15s, background 0.15s;
  }

  .layout-import-btn:hover {
    border-color: rgba(212, 168, 67, 0.4);
    color: #d4a843;
    background: rgba(212, 168, 67, 0.05);
  }
`;
