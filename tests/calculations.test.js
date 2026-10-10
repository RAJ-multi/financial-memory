import test from 'node:test';
import assert from 'node:assert/strict';
import {
  round2,
  formatCurrency,
  getTodaySpending,
  getRemainingDailyBudget,
  getAllTimeSavingsTotal,
  getCurrentMonthSummary
} from '../src/calculations.js';

test('round2 handles floating precision properly', () => {
  assert.equal(round2(10.123), 10.12);
  assert.equal(round2(10.129), 10.13);
  assert.equal(round2(0.1 + 0.2), 0.3);
});

test('formatCurrency formats USD correctly including negative amounts', () => {
  assert.equal(formatCurrency(25), '$25.00');
  assert.equal(formatCurrency(0), '$0.00');
  assert.equal(formatCurrency(-45.5), '-$45.50');
});

test('getTodaySpending sums expenses for today only', () => {
  const expenses = [
    { amount: 15.50, date: '2026-10-10' },
    { amount: 10.00, date: '2026-10-10' },
    { amount: 99.00, date: '2026-10-09' }
  ];
  assert.equal(getTodaySpending(expenses, '2026-10-10'), 25.50);
  assert.equal(getTodaySpending(expenses, '2026-10-09'), 99.00);
  assert.equal(getTodaySpending(expenses, '2026-10-08'), 0.00);
});

test('getRemainingDailyBudget handles unconfigured budget', () => {
  const expenses = [{ amount: 20, date: '2026-10-10' }];
  const result = getRemainingDailyBudget(expenses, null, '2026-10-10');
  assert.equal(result.configured, false);
  assert.equal(result.status, 'unconfigured');
});

test('getRemainingDailyBudget calculates under-budget state', () => {
  const expenses = [
    { amount: 15.00, date: '2026-10-10' },
    { amount: 10.50, date: '2026-10-10' }
  ];
  const result = getRemainingDailyBudget(expenses, 50.00, '2026-10-10');
  assert.equal(result.configured, true);
  assert.equal(result.status, 'under');
  assert.equal(result.todaySpending, 25.50);
  assert.equal(result.remaining, 24.50);
  assert.equal(result.over, 0);
});

test('getRemainingDailyBudget calculates exact budget match', () => {
  const expenses = [{ amount: 50.00, date: '2026-10-10' }];
  const result = getRemainingDailyBudget(expenses, 50.00, '2026-10-10');
  assert.equal(result.configured, true);
  assert.equal(result.status, 'under');
  assert.equal(result.remaining, 0.00);
  assert.equal(result.over, 0.00);
});

test('getRemainingDailyBudget shows over-budget unclamped when spending exceeds target', () => {
  const expenses = [
    { amount: 35.00, date: '2026-10-10' },
    { amount: 25.00, date: '2026-10-10' },
    { amount: 100.00, date: '2026-10-05' } // other day, excluded
  ];
  const result = getRemainingDailyBudget(expenses, 50.00, '2026-10-10');
  assert.equal(result.configured, true);
  assert.equal(result.status, 'over');
  assert.equal(result.todaySpending, 60.00);
  assert.equal(result.remaining, 0);
  assert.equal(result.over, 10.00); // unclamped over-budget amount
});

test('getAllTimeSavingsTotal calculates savings minus expenses across all dates', () => {
  // Empty state: $0.00
  assert.deepEqual(getAllTimeSavingsTotal([], []), {
    totalSavings: 0,
    totalExpenses: 0,
    balance: 0,
    countSavings: 0,
    countExpenses: 0
  });

  // Expenses with no savings: negative cumulative total
  const expenses = [
    { amount: 20.00, date: '2026-09-15' },
    { amount: 30.50, date: '2026-10-10' }
  ];
  const expOnlyResult = getAllTimeSavingsTotal(expenses, []);
  assert.equal(expOnlyResult.totalSavings, 0);
  assert.equal(expOnlyResult.totalExpenses, 50.50);
  assert.equal(expOnlyResult.balance, -50.50);

  // Positive savings
  const savings = [
    { amount: 100.00, date: '2026-09-01' },
    { amount: 50.00, date: '2026-10-01' }
  ];
  const positiveResult = getAllTimeSavingsTotal(expenses, savings);
  assert.equal(positiveResult.totalSavings, 150.00);
  assert.equal(positiveResult.totalExpenses, 50.50);
  assert.equal(positiveResult.balance, 99.50);
});

test('getCurrentMonthSummary computes current month category totals, daily totals, and handles ties honestly', () => {
  const expenses = [
    { amount: 40.00, category: 'Food & Drinks', date: '2026-10-05' },
    { amount: 40.00, category: 'Transport', date: '2026-10-05' },
    { amount: 20.00, category: 'Education', date: '2026-10-06' },
    { amount: 100.00, category: 'Food & Drinks', date: '2026-09-30' } // previous month, excluded
  ];

  const summary = getCurrentMonthSummary(expenses, '2026-10');
  assert.equal(summary.totalSpending, 100.00);
  assert.equal(summary.expenseCount, 3);

  // Check category breakdown has all 8 categories
  assert.equal(summary.categoryBreakdown.length, 8);
  const food = summary.categoryBreakdown.find(c => c.category === 'Food & Drinks');
  const transport = summary.categoryBreakdown.find(c => c.category === 'Transport');
  const other = summary.categoryBreakdown.find(c => c.category === 'Other');
  assert.equal(food.amount, 40.00);
  assert.equal(transport.amount, 40.00);
  assert.equal(other.amount, 0.00);

  // Highest category is a tie between Food & Drinks and Transport
  assert.equal(summary.highestCategoryResult.hasData, true);
  assert.equal(summary.highestCategoryResult.isTie, true);
  assert.deepEqual(summary.highestCategoryResult.categories.sort(), ['Food & Drinks', 'Transport'].sort());
  assert.equal(summary.highestCategoryResult.amount, 40.00);

  // Highest day is 2026-10-05 with $80 total
  assert.equal(summary.highestDayResult.hasData, true);
  assert.equal(summary.highestDayResult.isTie, false);
  assert.deepEqual(summary.highestDayResult.dates, ['2026-10-05']);
  assert.equal(summary.highestDayResult.amount, 80.00);
});
