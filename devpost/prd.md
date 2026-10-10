---
doc: prd
status: draft
---

# Financial Memory — Product Requirements

A local-first financial-history explorer for students, built around trustworthy current-month spending answers and a transparent all-time recorded savings total.

Source: `scope.md > The Unique Kernel`, `The Core Loop`, and `The POC Boundary`.

## The Core Journey

1. On first launch, the student is offered an optional daily spending target. They may set a valid positive USD target or continue without one. No account, sign-in, savings setup, or sample data is required.
2. The student arrives at the Dashboard. It makes `+ Add Expense` the clearest action; if there are no expenses, it shows a helpful empty state with `Add your first expense` rather than invented charts or totals. If no daily budget exists, it shows a prompt to configure one rather than a misleading remaining amount.
3. The student records a dated, categorised expense. The Dashboard updates today’s recorded spending, the remaining daily-budget context when configured, and the current-month category chart. A clear confirmation explains the expense’s daily-budget impact.
4. The student can instead visit Savings and add a dated saving contribution whenever they choose. The separate all-time recorded total updates from all locally recorded saving contributions and expenses; it is never presented as a bank balance.
5. After expenses exist in the current calendar month, the student opens the floating Ask Financial Memory control and asks one of the two supported monthly spending questions. The focused popup returns a deterministic answer from saved expense records only.
6. The student uses `View Monthly History` to inspect the same current-month category totals, daily totals, and underlying expense records used for the answer. They can correct or remove an entry directly from its history/detail view; all affected views and calculations refresh immediately.
7. At any time, the student uses Settings to change or remove the daily target, adjust appearance, or deliberately erase all local financial records.

Source: `scope.md > The Core Loop`, `What "Working" Looks Like`, and `The POC Boundary`.

## Screens and Layout

### App Shell and Navigation

On larger screens, a sidebar links to Dashboard, Monthly History, Savings, and Settings. On smaller screens, a hamburger menu provides those same destinations. Navigation, dialogs, charts, and all pages follow the active appearance preference.

### Dashboard

The Dashboard prioritises today’s recorded spending and the remaining daily-budget context. `+ Add Expense` is the visually dominant action. The current-month category chart sits below the daily information, while the floating Ask Financial Memory button remains easy to reach but visually secondary.

When no expenses exist, the Dashboard shows a useful empty state and a prominent `Add your first expense` action. It does not show fake chart segments or misleading remaining-budget data. When no daily budget is configured, it presents a prompt to configure one rather than a numeric remainder.

### Expense and Saving Entry Surfaces

`+ Add Expense` opens an expense-entry surface. `Add Saving` is available from the separate Savings section and opens a saving-contribution surface. Existing entries are accessible from their relevant history list or entry detail for editing or deletion; no separate management screen exists.

### Ask Financial Memory Popup

The floating control opens a compact, readable popup. It is a focused query surface, not an unrestricted AI chat interface. It contains the question input, supported-question guidance, answer states, and the verification action when an answer exists.

### Monthly History

Monthly History shows the current local calendar month only. It does not provide prior-month, next-month, custom-range, yearly, or all-time browsing in the MVP. It presents the month’s recorded expense total, category breakdown, daily totals, and inspectable expense entries.

### Savings

Savings is an optional section with a prominent all-time recorded total, an `+ Add Saving` action, a small transparency note directly beneath the total, and a history of saving contributions. It has no onboarding, setup, skip step, bank connection, account, transfer, or goal-management flow.

### Settings

Settings has three clear sections: Daily Budget, Appearance, and Local Data. It remains a simple control page rather than an administrative console.

Source: `scope.md > Inspiration & Identity` and `The POC Boundary`.

## Look and Feel

Financial Memory should feel clean and visually impressive without becoming overdesigned: restrained colours, consistent cards, generous spacing, and readable responsive layouts. The system light/dark theme is the default; modest appearance choices personalise the app without sacrificing contrast or readability. Charts must communicate exact values through labels or a legend rather than colour alone. The interface should feel calm and legible, not like a bank portal or an elaborate accounting suite.

Source: `scope.md > Inspiration & Identity` and `The POC Boundary`.

## Features and Behavior

### First Use and Daily Budget

- First launch offers an optional daily-budget target in USD. The student may set it or continue without one.
- Daily Budget in Settings shows the current target or clearly says that none is configured.
- A student can set, edit, or remove the target in Settings. Valid submissions save immediately and refresh the Dashboard’s budget context.
- Only positive numeric USD amounts are accepted. Zero, negative, and invalid values produce a clear inline message and do not replace the saved target.
- Removing a target returns the Dashboard to its `Set a daily budget` prompt. The product explains that this target is a spending reference, not a bank balance.
- **Remaining daily budget calculation rule:**
  - When configured, the remaining daily budget equals the configured daily budget minus the sum of all recorded expenses dated today.
  - The calculation includes all expense categories.
  - Savings contributions and expenses dated on other days are excluded from the daily-budget calculation.
  - If today's recorded spending exceeds the target, the interface shows the amount over budget rather than clamping the remaining amount to zero.
  - The remaining daily budget recalculates immediately after adding, editing, or deleting an expense.
  - If no daily budget is configured, the app shows the setup prompt and no numeric remainder.
  - The interface explains that this calculation reflects recorded expenses only, not unrecorded spending or an actual bank balance.

Source: `scope.md > The POC Boundary`.

### Expenses, Saving Contributions, and Entry Changes

- An expense requires an amount, category, and date. A saving contribution requires an amount and date. Descriptions are optional for both.
- Every expense has exactly one fixed built-in category: Food & Drinks, Transport, Education, Shopping, Entertainment, Bills & Utilities, Health, or Other. `Other` is used when no named category fits.
- Students cannot create, rename, or delete categories in the MVP. The same category names are used in the expense form, Dashboard chart, Monthly History, and Ask Financial Memory calculations.
- Dates default to today and can be changed; saving contributions may be dated in the past.
- Every entry is in USD. Invalid or missing required fields are shown clearly and cannot be saved.
- A student can edit or delete an expense from its expense-history entry or detail, and a saving contribution from its savings-history entry or detail.
- Editing validates the updated fields and refreshes every affected total, chart, question result, current-month history value, and all-time recorded savings total.
- Deletion requires an explicit confirmation. Dismissing the confirmation does nothing. Confirmed deletion refreshes the same affected information immediately.
- All entries remain stored locally. No separate management screen, cloud record, or account is introduced.

Source: `scope.md > The POC Boundary` and `What "Working" Looks Like`.

### Dashboard and Expense Feedback

- The Dashboard shows today’s recorded expense spending, a daily-budget context only when configured (displaying remaining daily budget or amount over budget), and a current-month expense category chart. When no daily budget is configured, it presents a prompt to configure one and no numeric remainder.
- The current-month chart reflects recorded expenses only; saving contributions never appear in it. Category totals are calculated from the recorded expenses assigned to the fixed category names.
- Saving an expense produces a clear confirmation with a short daily-budget-impact reminder.
- Dashboard values and chart data refresh immediately when relevant entries are added, edited, or deleted.

Source: `scope.md > The Core Loop` and `The POC Boundary`.

### Ask Financial Memory and Verification

- The popup supports only these current-calendar-month questions:
  - Which category has the highest spending this month?
  - Which day had the highest spending this month?
- For a supported category question, the result puts the direct answer first, gives the exact calculated USD category total, and shows that category’s share of recorded monthly spending when meaningful.
- For a supported highest-spending-day question, the result puts the direct answer first and gives the exact date and USD total for that day.
- Results are deterministic calculations from saved expense records for the current month only. Saving contributions never affect them.
- `View Monthly History` opens the same current month used by the result so the student can inspect the relevant category or daily total and underlying expenses.
- With no recorded expenses in the current month, the popup says there is not enough recorded data instead of estimating an answer.
- When categories or days tie, the popup reports the tie and the relevant amounts rather than picking one arbitrarily.
- Unsupported questions receive a clear explanation of the two currently supported question types. The popup never fabricates values, estimates missing purchases, or implies unrestricted AI chat.

Source: `scope.md > The Unique Kernel`, `What "Working" Looks Like`, and `The POC Boundary`.

### Current-Month History and Chart

- Monthly History displays the selected current calendar month and its total recorded expense spending. It shows an honest empty state when that month has no recorded expenses.
- The category chart shows the current month’s recorded expense categories, with each fixed category name and exact USD total in a legend or accompanying list. Category totals are calculated from recorded expenses assigned to each category and add up to the monthly expense total.
- Expenses are grouped by date. Each date has a visible daily total, and each expense shows its amount, category, optional description, and date.
- The highest-spending day is identifiable from daily totals or a simple indicator. Ties are represented honestly.
- Entries can be edited or deleted from this history/detail flow. Changes refresh the history total, chart, daily totals, and affected question results immediately.
- The history contains only real recorded entries. It does not create placeholders for days without expenses or include saving contributions.

Source: `scope.md > The POC Boundary` and `What "Working" Looks Like`.

### Savings

- Savings is optional and available whenever the student opens it; it has no required onboarding, configuration, or skip step.
- The prominent metric is labelled `All-time recorded total`, not `Bank balance` or `Money available`.
- Its deterministic formula is all recorded saving contributions minus all recorded expenses across every date. If neither type exists, it displays `$0.00`. If expenses exist but no saving contributions exist, it displays the corresponding negative amount.
- Directly beneath the metric, the section shows: “Recorded savings total — calculated from the savings contributions and expenses you’ve entered. This is not a verified bank balance and may not reflect your actual available money.”
- The contribution history shows saving-contribution amounts and dates, with access to edit and delete each entry.
- Adding, editing, or deleting either a contribution or an expense updates this total immediately. It does not affect expense spending totals, the category chart, or monthly spending answers.
- Older locally recorded entries remain stored and continue contributing to this all-time calculation even though Monthly History only browses the current month.

Source: `scope.md > The Core Loop`, `What "Working" Looks Like`, and `The POC Boundary`.

### Settings and Local Data

- **Daily Budget** follows the behavior defined in First Use and Daily Budget.
- **Appearance** follows the system light/dark preference by default. The student can explicitly choose Light or Dark and choose from a small set of tasteful preset backgrounds. Changes apply consistently across pages, charts, dialogs, and navigation and persist after restart. There is no custom colour picker or theme marketplace.
- **Local Data** explains that financial entries remain on the device and that the MVP has no sign-in or cloud sync.
- `Delete all local data` is visually distinct from normal settings. It opens a confirmation dialog explaining that confirmed deletion permanently removes locally recorded expenses, saving contributions, and the daily budget. Opening or dismissing the dialog never deletes data.
- After confirmed deletion, the app clears those records and budget, then shows the correct empty states without stale totals or charts. Appearance preferences remain unless a later technical constraint makes that impossible.

Source: `scope.md > The POC Boundary` and `Explicitly Cut`.

## States and Boundaries

- **First visit** — An optional daily-budget prompt is offered; the student can proceed without it. No sample transactions, bank balance, or required Savings setup appears.
- **No daily budget** — The Dashboard prompts the student to configure one and does not show a misleading remaining amount.
- **Spending exceeds daily budget** — The interface displays the exact amount over budget rather than clamping the remainder to zero.
- **No current-month expenses** — Dashboard and Monthly History use helpful empty states; the category chart has no fabricated data; Ask Financial Memory explains that it lacks enough recorded data.
- **No saving contributions or expenses** — Savings shows `$0.00` as the all-time recorded total and retains `+ Add Saving`.
- **Expenses but no saving contributions** — Savings shows a negative all-time recorded total equal to the cumulative recorded expenses and does not claim anything about actual available money.
- **Invalid entry or budget input** — The relevant form shows a clear inline validation message and preserves the previously saved data.
- **Tied monthly result** — The popup and Monthly History represent tied highest categories or days honestly.
- **Unsupported question** — The popup describes its supported current-month questions and returns no invented answer.
- **Local persistence** — Entries, daily budget, and appearance choices persist locally across app restarts; no account or cloud sync is required.
- **Deleted local data** — Confirmed deletion clears expenses, saving contributions, and the daily budget. It resets affected calculations and views, while preserving appearance preferences.
- **Data truthfulness** — The app can validate recorded fields but cannot know whether a student omitted a real purchase. All financial results are based only on recorded entries.

## Product Decisions

- **Student-only MVP** — keeps the demo focused on the primary user; General and Business profiles remain later work.
- **Local-first, account-free data** — supports privacy and removes sign-in and cloud complexity from the MVP.
- **Two supported monthly questions only** — preserves a reliable, deterministic, verifiable answer experience rather than claiming general financial AI.
- **Current-month verification only** — keeps the core loop demonstrable; prior-month navigation and broader history remain deferred.
- **Optional daily budget** — lets students use the app before they are ready to set a target, without inventing a remaining amount.
- **Daily-budget calculation rule** — configured daily budget minus the sum of all recorded expenses dated today across all categories; shows the over-budget amount rather than clamping to zero if exceeded; excludes savings contributions and expenses on other days; and recalculates immediately on entry changes.
- **Separate optional Savings section** — adds a transparent calculation from recorded entries without implying a bank account, transfer system, or verified balance.
- **USD-only ledger** — avoids unsafe currency relabelling and exchange-rate complexity.
- **Eight fixed expense categories** — keeps entry, chart, history, and deterministic-question calculations consistent; custom categories remain deferred.
- **Small Settings surface** — gives students control over budget, appearance, and local data without becoming a management system.

## What We're Building

- Student-only, local-first Financial Memory with no account.
- Optional first-use daily-budget setup and editable/removable daily-budget settings.
- Manual local USD expense and saving-contribution entries with required-field validation, editing, deletion confirmation, and immediate recalculation.
- Dashboard with current-day expense context, a primary `+ Add Expense` action, current-month category chart, and appropriate empty states.
- Current-month-only Monthly History with category totals, daily totals, underlying inspectable expenses, and verification support for the question popup.
- A bounded Ask Financial Memory popup for the two supported deterministic monthly expense questions, including direct answers, evidence, ties, no-data, unsupported-question states, and the verification action.
- A separate Savings section with `+ Add Saving`, contribution history, and the transparent all-time recorded-total formula.
- Responsive sidebar/hamburger navigation, system-aware light/dark appearance with restrained preset backgrounds, and Settings with local-data deletion confirmation.

## Deferred From the POC

- Prior-month, future-month, yearly, all-time, or custom-range browsing — the MVP verifies current-month answers only; older records still support the all-time Savings calculation.
- General and Business profile interfaces, profile-specific confirmations, Business CSV import, and biometric security — they introduce separate flows and security considerations.
- Currency switching, multi-currency records, and exchange-rate conversion — USD is fixed in the MVP to keep all displayed values truthful.
- Notifications, exports, custom labels or categories, saved filters, automatic categorisation/label rules, and the About/“About Wallet” area — these do not strengthen the core demonstration.
- Cloud sync or backup — requires a separate privacy design.

## Possible Later Enhancements

- Broader financial-history views and custom date ranges once the current-month verification flow is proven.
- More deterministic question types, provided each remains grounded in inspectable saved records.
- Additional profile modes and careful Business import after the Student workflow is stable.

## Non-Goals

- Unrestricted AI chat, invented values, estimates of unrecorded purchases, or professional financial, tax, legal, or investment advice.
- Bank connections, separate accounts, transfers, reconciliation, envelope systems, or advanced savings management.
- Fake sign-in, cloud-only storage, or user authentication in the MVP.
- A generic settings marketplace, custom wallpaper uploads, or elaborate visual effects.

## Open Questions

None.
