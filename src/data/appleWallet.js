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

export function parseAppleWalletCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return { rows: [], error: "File appears empty." };

  const header = parseCSVLine(lines[0]).map(h =>
    h.trim().replace(/^"|"$/g, "").toLowerCase()
  );

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

    if (type === "payment") continue;

    const parts = rawDate.split("/");
    const date = parts.length === 3
      ? `${parts[2]}-${parts[0].padStart(2, "0")}-${parts[1].padStart(2, "0")}`
      : rawDate;

    const rawNum = parseFloat(rawAmt.replace(/[$,]/g, "") || "0");
    const amount = Math.abs(rawNum);
    if (!amount) continue;

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
