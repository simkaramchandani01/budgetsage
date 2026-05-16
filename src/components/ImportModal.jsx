import { useState, useRef } from "react";
import { Upload, FileText, X, Check, AlertCircle } from "lucide-react";
import { CATEGORIES } from "../data/store.js";

const CATEGORY_KEYS = Object.keys(CATEGORIES);

const APPLE_CATEGORY_MAP = {
  "food & drink":   "Food",
  "restaurants":    "Food",
  "groceries":      "Food",
  "shopping":       "Shopping",
  "transportation": "Transport",
  "entertainment":  "Entertainment",
  "health":         "Health",
  "beauty":         "Health",
  "medical":        "Health",
  "utilities":      "Utilities",
  "home":           "Housing",
  "rent":           "Housing",
  "subscriptions":  "Subscriptions",
  "streaming":      "Subscriptions",
  "salary":         "Salary",
};

function guessCategory(appleCategory) {
  if (!appleCategory) return "Other";
  const lower = appleCategory.toLowerCase();
  for (const [key, val] of Object.entries(APPLE_CATEGORY_MAP)) {
    if (lower.includes(key)) return val;
  }
  return "Other";
}

function parseCSVLine(line) {
  const result = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') { inQuotes = !inQuotes; }
    else if (ch === "," && !inQuotes) { result.push(cur); cur = ""; }
    else { cur += ch; }
  }
  result.push(cur);
  return result;
}

function parseAppleWalletCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return { rows: [], error: "File appears empty." };

  const header = parseCSVLine(lines[0]).map(h => h.trim().replace(/^"|"$/g, "").toLowerCase());

  const dateIdx = header.findIndex(h => h.includes("transaction date"));
  const descIdx = header.findIndex(h => h === "description");
  const catIdx  = header.findIndex(h => h === "category");
  const typeIdx = header.findIndex(h => h === "type");
  const amtIdx  = header.findIndex(h => h.includes("amount"));

  if (dateIdx === -1 || amtIdx === -1) {
    return {
      rows: [],
      error: "Format not recognized. Please export from Wallet → Apple Card → ··· → Statements → Export Transactions.",
    };
  }

  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const cells = parseCSVLine(line);
    const rawDate = cells[dateIdx]?.trim() ?? "";
    const desc    = cells[descIdx]?.trim() ?? "";
    const cat     = cells[catIdx]?.trim() ?? "";
    const type    = cells[typeIdx]?.trim().toLowerCase() ?? "";
    const rawAmt  = cells[amtIdx]?.trim() ?? "";

    // Skip card-payment rows — those aren't real expenses
    if (type === "payment") continue;

    // Parse MM/DD/YYYY → YYYY-MM-DD
    const parts = rawDate.split("/");
    const date = parts.length === 3
      ? `${parts[2]}-${parts[0].padStart(2, "0")}-${parts[1].padStart(2, "0")}`
      : rawDate;

    const rawNum = parseFloat(rawAmt.replace(/[$,]/g, "") || "0");
    const amount = Math.abs(rawNum);
    if (!amount) continue;

    // Apple Card: negative = purchase/expense, positive = refund/adjustment
    const txType = rawNum < 0 ? "expense" : "income";

    const stableId = `apple_${date}_${desc}_${amount}`
      .replace(/\s+/g, "_")
      .toLowerCase()
      .replace(/[^a-z0-9_.-]/g, "");

    rows.push({
      id: stableId,
      date,
      description: desc,
      amount,
      type: txType,
      category: guessCategory(cat),
      _original: cat,
    });
  }

  return { rows, error: null };
}

export default function ImportModal({ isOpen, onClose, onImport }) {
  const [step, setStep]         = useState("upload");
  const [rows, setRows]         = useState([]);
  const [fileName, setFileName] = useState("");
  const [error, setError]       = useState("");
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef(null);

  if (!isOpen) return null;

  function reset() {
    setStep("upload");
    setRows([]);
    setFileName("");
    setError("");
    setDragging(false);
  }

  function handleClose() {
    reset();
    onClose();
  }

  function handleFile(file) {
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const { rows: parsed, error: err } = parseAppleWalletCSV(e.target.result);
      if (err) { setError(err); return; }
      if (!parsed.length) { setError("No importable transactions found."); return; }
      setRows(parsed);
      setError("");
      setStep("preview");
    };
    reader.readAsText(file);
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  }

  function handleBackdrop(e) {
    if (e.target === e.currentTarget) handleClose();
  }

  function updateRow(id, key, val) {
    setRows(prev => prev.map(r => r.id === id ? { ...r, [key]: val } : r));
  }

  function handleImport() {
    // Strip internal helper field before saving
    const clean = rows.map(({ _original, ...r }) => r);
    onImport(clean);
    setStep("done");
  }

  const fmt = (n) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(n);

  return (
    <>
      <style>{styles}</style>
      <div className="imp-backdrop" onClick={handleBackdrop}>
        <div className="imp-card">

          <div className="imp-header">
            <h2 className="imp-title">Import Apple Wallet</h2>
            <button className="imp-close" onClick={handleClose} aria-label="Close">
              <X size={15} />
            </button>
          </div>

          {/* ── STEP: upload ── */}
          {step === "upload" && (
            <div className="imp-body">
              <p className="imp-hint">
                Export from <strong>Wallet → Apple Card → ···</strong><br />
                then <strong>Statements → Export Transactions</strong> as a CSV.
              </p>

              <div
                className={`imp-dropzone${dragging ? " imp-dropzone--over" : ""}`}
                onClick={() => fileRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
              >
                <Upload size={26} className="imp-drop-icon" />
                <div className="imp-drop-label">Drop your CSV here</div>
                <div className="imp-drop-sub">or click to browse</div>
              </div>

              <input
                ref={fileRef}
                type="file"
                accept=".csv,text/csv"
                style={{ display: "none" }}
                onChange={(e) => handleFile(e.target.files[0])}
              />

              {error && (
                <div className="imp-error-row">
                  <AlertCircle size={13} />
                  {error}
                </div>
              )}
            </div>
          )}

          {/* ── STEP: preview ── */}
          {step === "preview" && (
            <div className="imp-body">
              <div className="imp-file-row">
                <FileText size={13} />
                <span className="imp-file-name">{fileName}</span>
                <span className="imp-file-count">{rows.length} transactions</span>
              </div>

              <div className="imp-table-wrap">
                <table className="imp-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Description</th>
                      <th>Amount</th>
                      <th>Type</th>
                      <th>Category</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.id}>
                        <td className="imp-td-date">{row.date}</td>
                        <td className="imp-td-desc" title={row.description}>{row.description}</td>
                        <td className={`imp-td-amt ${row.type === "expense" ? "clr-expense" : "clr-income"}`}>
                          {row.type === "expense" ? "−" : "+"}{fmt(row.amount)}
                        </td>
                        <td>
                          <select
                            className="imp-mini-sel"
                            value={row.type}
                            onChange={(e) => updateRow(row.id, "type", e.target.value)}
                          >
                            <option value="expense">Expense</option>
                            <option value="income">Income</option>
                          </select>
                        </td>
                        <td>
                          <select
                            className="imp-mini-sel"
                            value={row.category}
                            onChange={(e) => updateRow(row.id, "category", e.target.value)}
                          >
                            {CATEGORY_KEYS.map(c => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="imp-actions">
                <button className="imp-btn-cancel" onClick={reset}>Back</button>
                <button className="imp-btn-primary" onClick={handleImport}>
                  Import {rows.length} Transactions
                </button>
              </div>
            </div>
          )}

          {/* ── STEP: done ── */}
          {step === "done" && (
            <div className="imp-body imp-done">
              <div className="imp-done-icon">
                <Check size={26} strokeWidth={2.5} />
              </div>
              <div className="imp-done-msg">{rows.length} transactions imported</div>
              <div className="imp-done-sub">Categories and charts updated.</div>
              <button className="imp-btn-primary imp-done-btn" onClick={handleClose}>
                Done
              </button>
            </div>
          )}

        </div>
      </div>
    </>
  );
}

const styles = `
  .imp-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.75);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .imp-card {
    background: #1a1816;
    border-radius: 16px;
    width: 680px;
    max-width: calc(100vw - 32px);
    max-height: calc(100vh - 48px);
    display: flex;
    flex-direction: column;
    box-shadow: 0 28px 72px rgba(0, 0, 0, 0.65);
    overflow: hidden;
  }

  .imp-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 22px 24px 0;
    flex-shrink: 0;
  }

  .imp-title {
    font-family: Georgia, "Times New Roman", serif;
    font-size: 20px;
    font-weight: 700;
    color: #d4a843;
    margin: 0;
    letter-spacing: -0.3px;
  }

  .imp-close {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    background: transparent;
    border: none;
    color: #666;
    cursor: pointer;
    border-radius: 7px;
    transition: background 0.12s, color 0.12s;
  }

  .imp-close:hover {
    background: rgba(255,255,255,0.06);
    color: #f0ece4;
  }

  .imp-body {
    padding: 20px 24px 24px;
    overflow-y: auto;
    flex: 1;
  }

  .imp-hint {
    font-size: 13px;
    color: #a09890;
    line-height: 1.55;
    margin: 0 0 18px;
  }

  .imp-hint strong {
    color: #f0ece4;
    font-weight: 600;
  }

  .imp-dropzone {
    border: 1.5px dashed rgba(255,255,255,0.14);
    border-radius: 12px;
    padding: 36px 20px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    cursor: pointer;
    transition: border-color 0.15s, background 0.15s;
  }

  .imp-dropzone:hover,
  .imp-dropzone--over {
    border-color: rgba(212, 168, 67, 0.5);
    background: rgba(212, 168, 67, 0.04);
  }

  .imp-drop-icon {
    color: #d4a843;
    margin-bottom: 4px;
  }

  .imp-drop-label {
    font-size: 15px;
    font-weight: 600;
    color: #f0ece4;
  }

  .imp-drop-sub {
    font-size: 12px;
    color: #555;
  }

  .imp-error-row {
    display: flex;
    align-items: center;
    gap: 7px;
    margin-top: 14px;
    font-size: 12px;
    color: #e07060;
  }

  .imp-file-row {
    display: flex;
    align-items: center;
    gap: 7px;
    margin-bottom: 14px;
    font-size: 13px;
    color: #a09890;
  }

  .imp-file-name {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: #f0ece4;
  }

  .imp-file-count {
    background: rgba(212, 168, 67, 0.12);
    color: #d4a843;
    font-size: 11px;
    font-weight: 600;
    padding: 2px 8px;
    border-radius: 20px;
    white-space: nowrap;
  }

  .imp-table-wrap {
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 10px;
    overflow: auto;
    max-height: 340px;
    margin-bottom: 18px;
  }

  .imp-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 12.5px;
  }

  .imp-table thead th {
    position: sticky;
    top: 0;
    background: #222019;
    padding: 9px 10px;
    text-align: left;
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: #666;
    border-bottom: 1px solid rgba(255,255,255,0.07);
    white-space: nowrap;
  }

  .imp-table tbody tr {
    border-bottom: 1px solid rgba(255,255,255,0.04);
    transition: background 0.1s;
  }

  .imp-table tbody tr:last-child {
    border-bottom: none;
  }

  .imp-table tbody tr:hover {
    background: rgba(255,255,255,0.025);
  }

  .imp-table td {
    padding: 7px 10px;
    color: #f0ece4;
    vertical-align: middle;
  }

  .imp-td-date {
    white-space: nowrap;
    color: #666 !important;
    font-size: 11.5px !important;
  }

  .imp-td-desc {
    max-width: 180px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .imp-td-amt {
    white-space: nowrap;
    font-weight: 600;
    font-size: 12.5px;
  }

  .imp-mini-sel {
    background: #0f0e0d;
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 6px;
    color: #f0ece4;
    font-size: 12px;
    font-family: inherit;
    padding: 3px 5px;
    outline: none;
    cursor: pointer;
    transition: border-color 0.12s;
  }

  .imp-mini-sel:focus {
    border-color: rgba(212, 168, 67, 0.45);
  }

  .imp-mini-sel option {
    background: #1a1816;
  }

  .imp-actions {
    display: flex;
    gap: 10px;
  }

  .imp-btn-cancel {
    flex: 1;
    padding: 10px;
    background: transparent;
    color: #a09890;
    border: 1px solid rgba(255,255,255,0.12);
    border-radius: 10px;
    font-size: 13.5px;
    font-weight: 500;
    font-family: inherit;
    cursor: pointer;
    transition: border-color 0.15s, color 0.15s;
  }

  .imp-btn-cancel:hover {
    border-color: rgba(255,255,255,0.25);
    color: #f0ece4;
  }

  .imp-btn-primary {
    flex: 2;
    padding: 10px;
    background: #d4a843;
    color: #0f0e0d;
    border: none;
    border-radius: 10px;
    font-size: 13.5px;
    font-weight: 600;
    font-family: inherit;
    cursor: pointer;
    transition: opacity 0.15s;
  }

  .imp-btn-primary:hover {
    opacity: 0.88;
  }

  /* Done state */
  .imp-done {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 40px 24px;
    gap: 8px;
  }

  .imp-done-icon {
    width: 52px;
    height: 52px;
    border-radius: 50%;
    background: rgba(76, 175, 138, 0.14);
    color: #4caf8a;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 6px;
  }

  .imp-done-msg {
    font-size: 16px;
    font-weight: 700;
    color: #f0ece4;
    letter-spacing: -0.3px;
  }

  .imp-done-sub {
    font-size: 13px;
    color: #666;
    margin-bottom: 16px;
  }

  .imp-done-btn {
    flex: none;
    width: 160px;
  }

  .clr-expense { color: #e07060; }
  .clr-income  { color: #4caf8a; }
`;
