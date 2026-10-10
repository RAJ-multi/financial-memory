---
doc: scope
status: approved
---

# Financial Memory

A local-first, student-focused expense-history explorer that turns recorded transactions into a trustworthy explanation of this month’s spending.

## The Unique Kernel

Financial Memory connects an expense someone entered with a checkable explanation of where their money went. Instead of posing as an all-purpose financial chatbot, it supports a small, defined set of monthly spending questions and answers them with deterministic calculations from stored transactions—never invented figures.

## Who It's For

A student who records everyday expenses but cannot easily see which categories consume the most money or how their spending changes across a month. They currently have a list of purchases, notes, or a budgeting app but lack a clear, verifiable history-based explanation.

## The Core Loop

The student adds categorized expenses as they occur, opens the dashboard for today’s spending and daily-budget context, then checks the current month. They ask a supported question about the month’s highest-spending category or day, receive totals based only on saved entries, and verify the result in the monthly history and category chart. Separately, they can record savings contributions and see an all-time savings total based only on recorded entries.

## Inspiration & Identity

Polished but practical: a responsive interface that starts with the system light/dark theme, offers a small built-in appearance choice, and makes personal financial history feel calm and legible. A desktop sidebar and mobile hamburger menu make Dashboard, Monthly History, Savings, and Settings easy to reach. The visual work serves comprehension and verification, rather than simulating a bank or a complex accounting suite.

## Why This Matters to the Learner

The learner wants to practice a complete plan-first workflow while building an understandable, reliable app. The project creates useful practice evaluating a simple architecture, deterministic calculations, and unfamiliar code without letting feature count overwhelm the core experience.

## What "Working" Looks Like

In a short demo, a student adds several sample expenses in USD and receives a confirmation that shows the expense’s daily-budget impact. They see today’s spend, remaining daily budget, and a category chart, then open the floating Ask Financial Memory button. Its popup is a focused query surface—not unrestricted AI chat—and answers only the supported, deterministic spending questions. They ask: “Where did most of my money go this month, and which day did I spend the most?” Financial Memory returns the highest-spending category and day with the relevant totals, based only on recorded transactions. The student can cross-check those results in the monthly history and chart. They can also add a saving contribution and see the all-time recorded savings total update as total saving contributions minus total expenses across every date; the label makes clear that this is not a verified bank balance. Editing or deleting either entry type recalculates the appropriate totals. The app can detect missing or invalid required transaction fields, but cannot know about purchases the student never recorded. Ties, empty data, incomplete data, and unsupported questions receive clear, honest states rather than guessed answers.

## The POC Boundary

### Essential for the end-to-end demo

- A single visible **Student** experience with local-first transaction storage and no account.
- Manual entry of a dated, categorised USD expense and a simple daily-budget context. USD is the fixed MVP currency; no currency conversion is implied.
- A separate, optional-to-use Savings section with an **Add Saving** action. There is no required Savings onboarding, setup, or skip step; a saving contribution is its own entry type, never an expense.
- An all-time—not daily, monthly, or yearly—**recorded savings total**, calculated deterministically as every recorded saving contribution minus every recorded expense across all dates. If no saving contributions exist, it remains negative by the cumulative recorded expenses. It is clearly labelled as based on recorded entries, not a verified bank balance.
- Editing or deleting either an expense or a saving contribution recalculates the all-time recorded savings total and relevant period spending totals. Saving contributions never count toward expense spending, the category chart, or monthly spending-question results.
- A clear student expense confirmation that includes a short daily-budget-impact reminder after an expense is saved.
- A dashboard showing today’s spending, remaining daily budget, and a current-month category chart.
- A current-month history view that exposes the transactions and totals needed to verify an answer.
- Responsive navigation: a sidebar on larger screens and a hamburger menu on small screens, linking only to Dashboard, Monthly History, Savings, and Settings.
- A minimal Settings screen/menu with local appearance and privacy controls: system theme by default, explicit light/dark choice, a small preset background choice, and a confirmed “delete all local data” action.
- A floating Ask Financial Memory button that opens a small text-style popup. The popup is explicitly a focused query surface, not unrestricted AI chat, and answers only a small set of supported, deterministic spending questions for the current month:
  - highest-spending category;
  - highest-spending day; and
  - relevant deterministic totals.
- Honest handling of missing or invalid required fields, ties, no matching transactions, incomplete data, and unsupported questions; all answers are based only on recorded transactions, with no fabricated values or claim of arbitrary financial-question support.
- A practical responsive UI with system-aware light/dark themes for the primary dashboard and monthly-history flow.

### Deliberately simple

- The transaction structure should not hard-code student-only assumptions, so future profiles remain possible; no multi-profile abstractions, switching, or screens are built now.
- Calculations and question interpretation are constrained to what can be checked against the saved transaction data.
- Savings stays a single, local record of contributions and expenses—not a bank account, envelope system, or advanced savings-management feature.
- Appearance choices are limited to built-in app styles; no custom image, upload, or wallpaper system is introduced.

## Later

- General and Business profile experiences built on the same transaction foundation.
- Business CSV import.
- Daily, yearly, and all-time history explorations beyond the single all-time recorded savings total and current-month verification flow.
- More supported question intents, additional charts, richer budgets, and custom time ranges.
- A single-ledger currency setting that begins at USD and can be changed safely, with an explicit policy for existing transactions; multi-currency balances and exchange-rate conversion are separate future work.
- Full Settings capabilities: local notification preferences, custom labels, saved filters, automatic category or label rules, exports, and an About/“About Wallet” information area. The product name for that final item should be resolved before it ships.
- General- and Business-specific confirmation behavior, Business biometric security, and any PIN, password, or passkey feature. These require a clear threat model and secure platform/storage design rather than superficial locks.
- Optional cloud backup or sync, only with a separately designed privacy model.

## Explicitly Cut

- **Profile switching and a multi-profile system in the MVP:** Student is the only demonstrable user; extra modes would dilute the proof of concept.
- **CSV import:** useful for Business later, but not necessary to prove the student workflow.
- **Arbitrary AI financial chat:** cannot be reliably grounded and verified in this MVP; only defined monthly intents are supported.
- **Generated or inferred transaction values:** answers must come from deterministic calculations over stored data.
- **Accounts, sign-in, cloud sync, or fake authentication:** they add setup and privacy complexity without helping the core demo.
- **Bank connections, separate financial accounts, transfers, or advanced savings management:** the savings total is a transparent calculation from manually recorded entries, not a reconciliation or banking feature.
- **Multi-currency calculations or silent currency relabelling:** a simple USD ledger is safer than displaying values as a different currency without conversion.
- **Push/local notifications, automated rules, exports, and custom labels in the MVP:** each adds state, permissions, or edge cases without strengthening the verifiable monthly-answer demo.
- **Business biometrics and PIN/password/passkey controls in the MVP:** they create a false sense of security unless built around a full, reviewed security design.
- **Tax, legal, investment, or other professional financial advice:** outside the product’s evidence and purpose.
