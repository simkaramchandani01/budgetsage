# Personal Finance Tracker — Claude Agent Rules

## App Concept

A personal finance tracking app built with React + Vike. Users can:
- Track income and expenses
- View spending dashboards with charts
- Group transactions by category
- Import bank CSVs
- Chat with an AI budget coach named **Sage**

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Vike (React, SPA mode, no SSR) |
| Charts | Recharts |
| Icons | lucide-react |
| Styling | Plain CSS with CSS variables (no Tailwind) |
| State | React useState + localStorage via `useTransactions()` hook |
| AI | Anthropic Claude API via fetch — key from `import.meta.env.VITE_ANTHROPIC_API_KEY` |

## Folder Structure

```
src/data/        → store.js (hook + CATEGORIES), stats.js (pure functions)
src/views/       → Dashboard.jsx, Transactions.jsx, Categories.jsx
src/components/  → AddTransactionModal.jsx, ImportModal.jsx, SageChat.jsx
src/context/     → TransactionsContext.jsx
pages/           → Vike file-based routes
```

## Code Rules

- Always use functional React components with hooks, never class components
- Never use TypeScript — plain JavaScript only
- Never use Tailwind — use CSS variables and scoped styles only
- Always read from `useTransactions()` hook or `TransactionsContext`, never local mock data
- All Anthropic API calls use the key from `import.meta.env.VITE_ANTHROPIC_API_KEY`
- Never hardcode the API key anywhere in source files
- Always handle API errors gracefully with a fallback UI message
- Keep components focused — one responsibility per file
- Use lucide-react for all icons, never emoji as UI elements

## Design Rules

- **Background:** `#0f0e0d`
- **Surface:** `#1a1816`
- **Text:** `#f0ece4`
- **Accent (gold):** `#d4a843`
- **Income:** `#4caf8a` (green)
- **Expenses:** `#e07060` (red)
- **Font:** DM Sans (loaded via Google Fonts in index.html)
- **Border radius:** 10–16px on cards, 8px on inputs
- All modals have a dark backdrop overlay and are centered on screen

## Category Colors

| Category | Color |
|---|---|
| Food | `#d4a843` |
| Transport | `#9b7fd4` |
| Housing | `#4caf8a` |
| Entertainment | `#e07060` |
| Health | `#5ba8d4` |
| Shopping | `#e08860` |
| Salary | `#4caf8a` |
| Subscriptions | `#c47fd4` |
| Utilities | `#7fb8d4` |
| Other | `#888888` |

## What NOT To Do

- Do not add a backend or database — localStorage only for now
- Do not add authentication
- Do not install new npm packages without asking first
- Do not rename or restructure existing files without asking
- Do not use inline styles — use CSS classes or CSS variables
