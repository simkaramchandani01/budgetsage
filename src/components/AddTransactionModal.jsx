import { useState } from "react";
import { CATEGORIES } from "../data/store.js";

const CATEGORY_KEYS = Object.keys(CATEGORIES);

function defaultState() {
  return {
    type: "expense",
    description: "",
    amount: "",
    category: CATEGORY_KEYS[0],
    date: new Date().toISOString().slice(0, 10),
    error: "",
  };
}

export default function AddTransactionModal({ isOpen, onClose, onAdd }) {
  const [form, setForm] = useState(defaultState);

  if (!isOpen) return null;

  function field(key) {
    return (e) => setForm((f) => ({ ...f, [key]: e.target.value, error: "" }));
  }

  function handleBackdrop(e) {
    if (e.target === e.currentTarget) onClose();
  }

  function handleSave() {
    if (!form.description.trim() || !form.amount) {
      setForm((f) => ({ ...f, error: "Please fill in all fields" }));
      return;
    }
    onAdd({
      id: Date.now(),
      type: form.type,
      description: form.description.trim(),
      amount: parseFloat(form.amount),
      category: form.category,
      date: form.date,
    });
    setForm(defaultState());
    onClose();
  }

  function selectType(type) {
    setForm((f) => ({ ...f, type, error: "" }));
  }

  return (
    <>
      <style>{styles}</style>
      <div className="atm-backdrop" onClick={handleBackdrop}>
        <div className="atm-card">
          <h2 className="atm-title">Add Transaction</h2>

          <div className="atm-type-toggle">
            <button
              className={`atm-type-btn${form.type === "expense" ? " atm-expense" : ""}`}
              onClick={() => selectType("expense")}
            >
              − Expense
            </button>
            <button
              className={`atm-type-btn${form.type === "income" ? " atm-income" : ""}`}
              onClick={() => selectType("income")}
            >
              + Income
            </button>
          </div>

          <div className="atm-fields">
            <input
              className="atm-input"
              type="text"
              placeholder="What was this for?"
              value={form.description}
              onChange={field("description")}
            />
            <input
              className="atm-input"
              type="number"
              placeholder="0.00"
              min="0"
              step="0.01"
              value={form.amount}
              onChange={field("amount")}
            />
            <select
              className="atm-select"
              value={form.category}
              onChange={field("category")}
            >
              {CATEGORY_KEYS.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <input
              className="atm-input"
              type="date"
              value={form.date}
              onChange={field("date")}
            />
          </div>

          {form.error && <p className="atm-error">{form.error}</p>}

          <div className="atm-actions">
            <button className="atm-btn-cancel" onClick={onClose}>Cancel</button>
            <button className="atm-btn-save" onClick={handleSave}>Save Transaction</button>
          </div>
        </div>
      </div>
    </>
  );
}

const styles = `
  .atm-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.72);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .atm-card {
    background: #1a1816;
    border-radius: 16px;
    padding: 28px 28px 24px;
    width: 420px;
    max-width: calc(100vw - 32px);
    box-shadow: 0 24px 64px rgba(0, 0, 0, 0.6);
    box-sizing: border-box;
  }

  .atm-title {
    font-family: Georgia, "Times New Roman", serif;
    font-size: 22px;
    color: #d4a843;
    font-weight: 700;
    margin: 0 0 22px;
    letter-spacing: -0.3px;
  }

  .atm-type-toggle {
    display: flex;
    gap: 8px;
    margin-bottom: 20px;
  }

  .atm-type-btn {
    flex: 1;
    padding: 9px;
    background: #0f0e0d;
    color: #a09890;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    font-family: inherit;
    cursor: pointer;
    transition: background 0.15s, color 0.15s, border-color 0.15s;
  }

  .atm-type-btn.atm-expense {
    background: rgba(224, 112, 96, 0.12);
    color: #e07060;
    border-color: rgba(224, 112, 96, 0.35);
  }

  .atm-type-btn.atm-income {
    background: rgba(76, 175, 138, 0.12);
    color: #4caf8a;
    border-color: rgba(76, 175, 138, 0.35);
  }

  .atm-fields {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-bottom: 16px;
  }

  .atm-input,
  .atm-select {
    width: 100%;
    padding: 10px 12px;
    background: #0f0e0d;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    color: #f0ece4;
    font-size: 14px;
    font-family: inherit;
    outline: none;
    box-sizing: border-box;
    transition: border-color 0.15s;
  }

  .atm-input:focus,
  .atm-select:focus {
    border-color: rgba(212, 168, 67, 0.5);
  }

  .atm-input::placeholder {
    color: #555;
  }

  .atm-select option {
    background: #1a1816;
  }

  .atm-error {
    font-size: 12px;
    color: #e07060;
    margin: 0 0 14px;
  }

  .atm-actions {
    display: flex;
    gap: 10px;
  }

  .atm-btn-cancel {
    flex: 1;
    padding: 11px;
    background: transparent;
    color: #a09890;
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 10px;
    font-size: 14px;
    font-weight: 500;
    font-family: inherit;
    cursor: pointer;
    transition: border-color 0.15s, color 0.15s;
  }

  .atm-btn-cancel:hover {
    border-color: rgba(255, 255, 255, 0.25);
    color: #f0ece4;
  }

  .atm-btn-save {
    flex: 1;
    padding: 11px;
    background: #d4a843;
    color: #0f0e0d;
    border: none;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 600;
    font-family: inherit;
    cursor: pointer;
    transition: opacity 0.15s;
  }

  .atm-btn-save:hover {
    opacity: 0.88;
  }
`;
