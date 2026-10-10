import test from 'node:test';
import assert from 'node:assert/strict';
import {
  round2,
  formatCurrency,
  getTodaySpending,
  getRemainingDailyBudget,
  getAllTimeSavingsTotal,
  getCurrentMonthSummary,
  getExpensesByPeriod,
  getPeriodSummary,
  getHistoricalComparison,
  getPreviousPeriodKey,
  getNextPeriodKey
} from '../src/calculations.js';
import { validateWallpaperFile } from '../src/wallpaper-db.js';
import { formatPeriodLabel } from '../src/chart-export.js';

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

test('formatCurrency supports multiple currencies and conventional zero-decimal precision for JPY', () => {
  // EUR
  assert.equal(formatCurrency(50, 'EUR'), '€50.00');
  // JPY zero-decimal conventional formatting
  assert.equal(formatCurrency(1200, 'JPY'), '¥1,200');
  assert.equal(formatCurrency(0, 'JPY'), '¥0');
  // INR
  assert.equal(formatCurrency(500, 'INR'), '₹500.00');
  // BDT
  assert.match(formatCurrency(500, 'BDT'), /BDT/);
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

test('getExpensesByPeriod filters by day, month, and year while excluding savings records', () => {
  const mixed = [
    { type: 'expense', amount: 15, category: 'Food & Drinks', date: '2026-10-10' },
    { type: 'expense', amount: 25, category: 'Transport', date: '2026-10-15' },
    { type: 'expense', amount: 50, category: 'Education', date: '2026-09-01' },
    { type: 'expense', amount: 100, category: 'Shopping', date: '2025-10-10' },
    { type: 'saving', amount: 200, date: '2026-10-10' } // must be excluded
  ];

  // Day filter
  const dayExpenses = getExpensesByPeriod(mixed, 'day', '2026-10-10');
  assert.equal(dayExpenses.length, 1);
  assert.equal(dayExpenses[0].amount, 15);

  // Month filter
  const monthExpenses = getExpensesByPeriod(mixed, 'month', '2026-10');
  assert.equal(monthExpenses.length, 2);
  assert.equal(monthExpenses.reduce((acc, curr) => acc + curr.amount, 0), 40);

  // Year filter
  const yearExpenses = getExpensesByPeriod(mixed, 'year', '2026');
  assert.equal(yearExpenses.length, 3);
  assert.equal(yearExpenses.reduce((acc, curr) => acc + curr.amount, 0), 90);
});

test('getPeriodSummary computes period totals and category distributions', () => {
  const expenses = [
    { type: 'expense', amount: 30, category: 'Transport', date: '2026-10-12' },
    { type: 'expense', amount: 70, category: 'Food & Drinks', date: '2026-10-12' }
  ];

  const summary = getPeriodSummary(expenses, 'day', '2026-10-12');
  assert.equal(summary.totalSpending, 100.00);
  assert.equal(summary.expenseCount, 2);
  const food = summary.categoryBreakdown.find(c => c.category === 'Food & Drinks');
  assert.equal(food.amount, 70.00);
  assert.equal(food.percentage, 70.00);
});

test('getHistoricalComparison correctly calculates comparison items, max values, and totals', () => {
  const expenses = [
    { type: 'expense', amount: 50, category: 'Food & Drinks', date: '2026-01-10' },
    { type: 'expense', amount: 150, category: 'Transport', date: '2026-03-15' },
    { type: 'expense', amount: 80, category: 'Education', date: '2026-03-20' },
    { type: 'expense', amount: 40, category: 'Shopping', date: '2025-05-01' }
  ];

  // Month comparison across 2026
  const comp = getHistoricalComparison(expenses, 'month', '2026');
  assert.equal(comp.periodType, 'month');
  assert.equal(comp.items.length, 12);
  assert.equal(comp.totalSpending, 280.00);
  // March has 150 + 80 = 230
  assert.equal(comp.maxTotal, 230.00);
  const marchItem = comp.items.find(i => i.key === '2026-03');
  assert.equal(marchItem.total, 230.00);
});

test('getPreviousPeriodKey and getNextPeriodKey navigate periods accurately', () => {
  assert.equal(getPreviousPeriodKey('day', '2026-10-10'), '2026-10-09');
  assert.equal(getNextPeriodKey('day', '2026-10-10'), '2026-10-11');
  assert.equal(getPreviousPeriodKey('day', '2026-01-01'), '2025-12-31');

  assert.equal(getPreviousPeriodKey('month', '2026-10'), '2026-09');
  assert.equal(getNextPeriodKey('month', '2026-10'), '2026-11');
  assert.equal(getPreviousPeriodKey('month', '2026-01'), '2025-12');

  assert.equal(getPreviousPeriodKey('year', '2026'), '2025');
  assert.equal(getNextPeriodKey('year', '2026'), '2027');
});

test('validateWallpaperFile validates supported types and enforces file size limits', () => {
  assert.equal(validateWallpaperFile(null).valid, false);

  const validPng = { type: 'image/png', size: 1024 * 1024, name: 'bg.png' };
  assert.equal(validateWallpaperFile(validPng).valid, true);

  const validJpg = { type: 'image/jpeg', size: 2 * 1024 * 1024, name: 'photo.jpg' };
  assert.equal(validateWallpaperFile(validJpg).valid, true);

  const validWebp = { type: 'image/webp', size: 500 * 1024, name: 'art.webp' };
  assert.equal(validateWallpaperFile(validWebp).valid, true);

  const invalidType = { type: 'application/pdf', size: 1024, name: 'doc.pdf' };
  assert.equal(validateWallpaperFile(invalidType).valid, false);

  const oversized = { type: 'image/png', size: 7 * 1024 * 1024, name: 'huge.png' };
  assert.equal(validateWallpaperFile(oversized).valid, false);
});

test('formatPeriodLabel formats user-friendly labels for charts and export headers', () => {
  const dayLabel = formatPeriodLabel('day', '2026-10-10');
  assert.match(dayLabel, /October/);
  assert.match(dayLabel, /2026/);

  const monthLabel = formatPeriodLabel('month', '2026-10');
  assert.match(monthLabel, /October/);
  assert.match(monthLabel, /2026/);

  const yearLabel = formatPeriodLabel('year', '2026');
  assert.equal(yearLabel, 'Year 2026');
});
