---
doc: spec
status: approved
---

# Financial Memory — Technical Specification

An implementation-focused specification for the local-first Financial Memory MVP, derived directly from the approved `scope.md` and `prd.md`.

## 1. System Architecture & Tech Stack

### Tech Stack
* **Language & Runtime:** Pure standards-compliant HTML5, CSS3, and modern modular ECMAScript (ES Modules).
* **Execution Environment:** Runs directly in any modern browser without heavy build tooling or runtime dependencies.
* **Storage Engine:** Browser `localStorage` with JSON serialization, providing instant local-first persistence without accounts or network connectivity.
* **Automated Testing:** Node.js native test runner (`node:test` and `node:assert`) executing calculation, storage, and question-processing logic.

### Directory Structure
```text
financial-memory/
├── index.html                  # Single-page application shell & templates
├── css/
│   ├── main.css                # Base layout, typography, cards, responsive sidebar/hamburger
│   └── themes.css              # Light, dark, and preset background styles
├── src/
│   ├── config.js               # Constants (8 fixed categories, storage keys, default settings)
│   ├── store.js                # LocalStorage abstraction, migration, and CRUD operations
│   ├── calculations.js         # Deterministic financial calculation engine
│   ├── query-engine.js         # Ask Financial Memory pattern matcher and answer generator
│   ├── ui.js                   # DOM rendering, views, chart drawing, dialogs, toasts
│   └── app.js                  # Entry point, router/navigation, form handlers
├── tests/
│   ├── calculations.test.js    # Unit tests for budgets, totals, ties, and savings formula
│   └── query-engine.test.js    # Unit tests for question matching and answer verification
├── devpost/
│   ├── learner-profile.md
│   ├── scope.md
│   ├── prd.md
│   └── spec.md
└── package.json                # Project configuration & test scripts
```

---

## 2. Data Models & Constants

### Constants (`src/config.js`)
* **Fixed Expense Categories (8):**
  1. `Food & Drinks`
  2. `Transport`
  3. `Education`
  4. `Shopping`
  5. `Entertainment`
  6. `Bills & Utilities`
  7. `Health`
  8. `Other`
* **Default Currency:** Fixed `USD` (`$`).
* **Storage Key:** `financial_memory_db_v1`.

### Data Schemas

#### Expense Entry
```json
{
  "id": "exp_1728560000000_abc123",
  "type": "expense",
  "amount": 24.50,
  "category": "Food & Drinks",
  "date": "2026-10-10",
  "description": "Lunch with friends",
  "createdAt": 1728560000000
}
```

#### Saving Contribution Entry
```json
{
  "id": "sav_1728560000000_xyz789",
  "type": "saving",
  "amount": 50.00,
  "date": "2026-10-10",
  "description": "Weekly deposit",
  "createdAt": 1728560000000
}
```

#### User Settings
```json
{
  "dailyBudget": 50.00,
  "theme": "system",
  "backgroundPreset": "default"
}
```

#### Root Storage Structure
```json
{
  "version": 1,
  "settings": {
    "dailyBudget": null,
    "theme": "system",
    "backgroundPreset": "default"
  },
  "expenses": [],
  "savings": []
}
```

---

## 3. Deterministic Financial Calculations (`src/calculations.js`)

All monetary calculations use fixed two-decimal arithmetic or cent integers to prevent floating-point inaccuracies.

### 1. Today's Expense Spending
* **Input:** Today's local date `YYYY-MM-DD`, expenses array.
* **Rule:** Filter expenses where `date === todayDate`. Sum `amount`.

### 2. Remaining Daily Budget
* **Rule:**
  * If `settings.dailyBudget === null`: return `{ configured: false }`.
  * If configured:
    $$\text{remaining} = \text{dailyBudget} - \text{todayExpenses}$$
  * If $\text{remaining} \ge 0$: `{ configured: true, status: 'under', remaining: remaining, over: 0 }`.
  * If $\text{remaining} < 0$: `{ configured: true, status: 'over', remaining: 0, over: |\text{remaining}| }`.
* Never clamp remaining spending to zero without reporting the over-budget amount.
* Excludes savings contributions and expenses on any date other than today.

### 3. All-Time Recorded Savings Total
* **Formula:**
  $$\text{Total} = \sum (\text{all saving contributions}) - \sum (\text{all recorded expenses across every date})$$
* If no expenses and no savings: display `$0.00`.
* If expenses exist with no savings: displays negative amount equal to cumulative expenses.
* Always accompanied by the transparency disclaimer:
  *"Recorded savings total — calculated from the savings contributions and expenses you’ve entered. This is not a verified bank balance and may not reflect your actual available money."*

### 4. Current-Month Expense Totals & Categories
* **Filter:** Expenses where `date.startsWith(currentYearMonth)`.
* **Category Breakdown:** For each of the 8 fixed categories, calculate total USD and percentage share of monthly spending.
* **Daily Totals:** Group current-month expenses by `date`, calculate total per day.
* **Highest-Spending Category:** Identify max amount. If multiple categories share the exact max, flag as a tie and list all tied categories.
* **Highest-Spending Day:** Identify day with max spending. If multiple days tie, report the tie honestly.

---

## 4. Ask Financial Memory Engine (`src/query-engine.js`)

A strictly bounded, deterministic query analyzer supporting two question intents:

### Intent A: Highest-Spending Category
* **Patterns Matched:** Queries asking for highest/top/most spending category for the current month (e.g., *"Where did most of my money go this month?"*, *"Which category has the highest spending this month?"*).
* **Response Output:**
  * Direct answer: Category name (or tied categories).
  * Evidence: Exact calculated USD total and percentage share.
  * Verification link: Triggers navigation to Monthly History.
  * Empty state: Explains that there is not enough recorded expense data for the current month.

### Intent B: Highest-Spending Day
* **Patterns Matched:** Queries asking for highest/biggest spending day/date for the current month (e.g., *"Which day did I spend the most this month?"*, *"Highest spending day this month"*).
* **Response Output:**
  * Direct answer: Date (or tied dates) and day-of-week.
  * Evidence: Exact calculated USD total for that day.
  * Verification link: Opens Monthly History.
  * Empty state: Explains that there is not enough recorded expense data for the current month.

### Unsupported Queries
* Returns a polite, honest explanation stating that Financial Memory is a focused deterministic query tool that answers only the two supported current-month spending questions, providing clickable suggested question prompts.

---

## 5. UI Structure & Interaction Workflows

### 1. Navigation Shell
* Desktop: Persistent left sidebar linking to **Dashboard**, **Monthly History**, **Savings**, **Settings**.
* Mobile: Header with hamburger toggle revealing the navigation links.
* Floating Action Button (FAB): "Ask Financial Memory" positioned at bottom-right, opening modal popup.

### 2. Dashboard View
* Daily Spending & Budget Context Card:
  * Shows today's spend.
  * If budget configured: displays remaining balance or amount over budget.
  * If unconfigured: shows prompt to set a daily budget.
* Primary action: `+ Add Expense` button opening modal form.
* Confirmation toast upon expense creation highlighting the daily-budget impact.
* Current-Month Category Chart: Visual SVG donut/bar breakdown of current-month expenses with legend and amounts.

### 3. Monthly History View
* Displays current calendar month heading (e.g., "October 2026").
* Summary header: Total monthly expenses.
* Category breakdown table matching chart figures.
* Date-grouped expense list with daily totals and highest-day indicator badge.
* Inline entry actions: Edit (reopens prefilled modal) and Delete (triggers confirmation dialog).
* Edits and confirmed deletions trigger immediate recalculation of all affected views and the all-time savings total.

### 4. Savings View
* Prominent card displaying **All-time recorded total** with clear color coding (positive/negative).
* Transparency note directly beneath the total.
* `+ Add Saving` button opening saving-contribution modal.
* List of recorded saving contributions with date, amount, description, and edit/delete actions.

### 5. Settings View
* **Daily Budget:** Input to set, update, or remove positive USD daily target.
* **Appearance:** Toggle for Theme (System, Light, Dark) and Background Presets (Default, Slate, Warm, Cool).
* **Local Data:** "Delete all local data" button opening strict confirmation modal. Confirmed deletion clears all expenses, savings, and budget, resetting views to empty states while preserving theme preferences.

---

## 6. Testing Strategy

1. **Calculations (`tests/calculations.test.js`):**
   * Daily budget remaining when under budget, exactly at budget, and over budget (unclamped).
   * All-time savings formula across all dates (zero state, negative expenses-only state, positive state).
   * Exclusion of savings from expense calculations and category charts.
   * Accurate tie handling for categories and days.
2. **Query Engine (`tests/query-engine.test.js`):**
   * Pattern matching for category and day questions.
   * Accurate calculation and evidence generation.
   * Proper empty state handling for empty months.
   * Rejection of unsupported queries with guidance.
3. **End-to-End Verification:**
   * Automated headless verification script to validate complete workflows in sequence.
