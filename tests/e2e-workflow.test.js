import test from 'node:test';
import assert from 'node:assert/strict';
import { store } from '../src/store.js';
import {
  getTodaySpending,
  getRemainingDailyBudget,
  getAllTimeSavingsTotal,
  getCurrentMonthSummary,
  getTodayDateString,
  getCurrentYearMonthString
} from '../src/calculations.js';
import { answerFinancialQuery } from '../src/query-engine.js';

test('End-to-End complete student workflow verification', () => {
  // 1. Clean state
  store.deleteAllLocalData();
  const today = getTodayDateString();
  const currentMonth = getCurrentYearMonthString();

  // 2. Initial state checks
  assert.equal(store.getExpenses().length, 0);
  assert.equal(store.getSavings().length, 0);
  assert.equal(store.getSettings().dailyBudget, null);

  const initialBudgetStatus = getRemainingDailyBudget(store.getExpenses(), store.getSettings().dailyBudget, today);
  assert.equal(initialBudgetStatus.configured, false);

  const initialSavings = getAllTimeSavingsTotal(store.getExpenses(), store.getSavings());
  assert.equal(initialSavings.balance, 0.00);

  // 3. Configure daily budget
  store.setDailyBudget(40.00);
  assert.equal(store.getSettings().dailyBudget, 40.00);

  let budgetStatus = getRemainingDailyBudget(store.getExpenses(), store.getSettings().dailyBudget, today);
  assert.equal(budgetStatus.configured, true);
  assert.equal(budgetStatus.status, 'under');
  assert.equal(budgetStatus.remaining, 40.00);
  assert.equal(budgetStatus.over, 0);

  // 4. Add expense 1 (today, Food & Drinks, $15)
  const exp1 = store.addExpense({
    amount: 15.00,
    category: 'Food & Drinks',
    date: today,
    description: 'Lunch'
  });
  assert.ok(exp1.id);

  budgetStatus = getRemainingDailyBudget(store.getExpenses(), store.getSettings().dailyBudget, today);
  assert.equal(budgetStatus.status, 'under');
  assert.equal(budgetStatus.todaySpending, 15.00);
  assert.equal(budgetStatus.remaining, 25.00);
  assert.equal(budgetStatus.over, 0);

  // Check all-time savings with 1 expense and 0 savings: negative $15
  let savingsStatus = getAllTimeSavingsTotal(store.getExpenses(), store.getSavings());
  assert.equal(savingsStatus.totalExpenses, 15.00);
  assert.equal(savingsStatus.totalSavings, 0.00);
  assert.equal(savingsStatus.balance, -15.00);

  // 5. Add expense 2 that puts student OVER budget today ($30 Transport)
  const exp2 = store.addExpense({
    amount: 30.00,
    category: 'Transport',
    date: today,
    description: 'Train pass'
  });
  assert.ok(exp2.id);

  // Today spend = $45, budget = $40 -> over budget by $5 (unclamped!)
  budgetStatus = getRemainingDailyBudget(store.getExpenses(), store.getSettings().dailyBudget, today);
  assert.equal(budgetStatus.status, 'over');
  assert.equal(budgetStatus.todaySpending, 45.00);
  assert.equal(budgetStatus.remaining, 0.00);
  assert.equal(budgetStatus.over, 5.00);

  // 6. Add saving contribution ($100)
  const sav1 = store.addSaving({
    amount: 100.00,
    date: today,
    description: 'Saved allowance'
  });
  assert.ok(sav1.id);

  // All-time savings = $100 - $45 = $55
  savingsStatus = getAllTimeSavingsTotal(store.getExpenses(), store.getSavings());
  assert.equal(savingsStatus.totalSavings, 100.00);
  assert.equal(savingsStatus.totalExpenses, 45.00);
  assert.equal(savingsStatus.balance, 55.00);

  // Savings never impacts daily budget
  budgetStatus = getRemainingDailyBudget(store.getExpenses(), store.getSettings().dailyBudget, today);
  assert.equal(budgetStatus.todaySpending, 45.00);
  assert.equal(budgetStatus.over, 5.00);

  // 7. Ask Financial Memory
  // Highest Category: Transport ($30) vs Food & Drinks ($15)
  const queryCat = answerFinancialQuery('Which category has the highest spending this month?', store.getExpenses(), currentMonth);
  assert.equal(queryCat.status, 'success');
  assert.match(queryCat.directAnswer, /Transport/);
  assert.match(queryCat.directAnswer, /\$30\.00/);
  assert.equal(queryCat.canVerify, true);

  // Highest Day: today ($45)
  const queryDay = answerFinancialQuery('Which day had the highest spending this month?', store.getExpenses(), currentMonth);
  assert.equal(queryDay.status, 'success');
  assert.match(queryDay.directAnswer, new RegExp(today));
  assert.match(queryDay.directAnswer, /\$45\.00/);
  assert.equal(queryDay.canVerify, true);

  // Unsupported query
  const queryUnsupported = answerFinancialQuery('Can I buy cryptocurrency?', store.getExpenses(), currentMonth);
  assert.equal(queryUnsupported.status, 'unsupported');
  assert.equal(queryUnsupported.canVerify, false);

  // 8. Edit expense 2 (reduce from $30 to $10) -> brings student back UNDER budget ($25 spent of $40)
  store.updateExpense(exp2.id, {
    amount: 10.00,
    category: 'Transport',
    date: today,
    description: 'Bus ticket only'
  });

  budgetStatus = getRemainingDailyBudget(store.getExpenses(), store.getSettings().dailyBudget, today);
  assert.equal(budgetStatus.status, 'under');
  assert.equal(budgetStatus.todaySpending, 25.00);
  assert.equal(budgetStatus.remaining, 15.00);
  assert.equal(budgetStatus.over, 0);

  // All-time savings recalculated: $100 - $25 = $75
  savingsStatus = getAllTimeSavingsTotal(store.getExpenses(), store.getSavings());
  assert.equal(savingsStatus.balance, 75.00);

  // Highest Category now Food & Drinks ($15) vs Transport ($10)
  const queryCatAfterEdit = answerFinancialQuery('Where did most of my money go this month?', store.getExpenses(), currentMonth);
  assert.match(queryCatAfterEdit.directAnswer, /Food & Drinks/);
  assert.match(queryCatAfterEdit.directAnswer, /\$15\.00/);

  // 9. Delete expense 1 ($15 Food & Drinks)
  store.deleteExpense(exp1.id);
  assert.equal(store.getExpenses().length, 1);

  budgetStatus = getRemainingDailyBudget(store.getExpenses(), store.getSettings().dailyBudget, today);
  assert.equal(budgetStatus.todaySpending, 10.00);
  assert.equal(budgetStatus.remaining, 30.00);

  savingsStatus = getAllTimeSavingsTotal(store.getExpenses(), store.getSavings());
  assert.equal(savingsStatus.totalExpenses, 10.00);
  assert.equal(savingsStatus.balance, 90.00);

  // 10. Delete saving 1 ($100)
  store.deleteSaving(sav1.id);
  assert.equal(store.getSavings().length, 0);
  savingsStatus = getAllTimeSavingsTotal(store.getExpenses(), store.getSavings());
  assert.equal(savingsStatus.totalSavings, 0.00);
  assert.equal(savingsStatus.totalExpenses, 10.00);
  assert.equal(savingsStatus.balance, -10.00); // negative cumulative expenses

  // 11. Theme and appearance changes
  store.setTheme('dark');
  store.setBackgroundPreset('warm');
  assert.equal(store.getSettings().theme, 'dark');
  assert.equal(store.getSettings().backgroundPreset, 'warm');

  // 12. Delete all local data
  store.deleteAllLocalData();
  assert.equal(store.getExpenses().length, 0);
  assert.equal(store.getSavings().length, 0);
  assert.equal(store.getSettings().dailyBudget, null);
  // Preserved appearance preferences:
  assert.equal(store.getSettings().theme, 'dark');
  assert.equal(store.getSettings().backgroundPreset, 'warm');
});
