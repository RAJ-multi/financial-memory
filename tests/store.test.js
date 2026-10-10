import test from 'node:test';
import assert from 'node:assert/strict';
import { store } from '../src/store.js';

test('store CRUD and reset lifecycle works correctly', () => {
  // Clear any existing
  store.deleteAllLocalData();

  // Initial settings
  assert.equal(store.getSettings().dailyBudget, null);
  assert.equal(store.getExpenses().length, 0);
  assert.equal(store.getSavings().length, 0);

  // Set daily budget
  store.setDailyBudget(45.50);
  assert.equal(store.getSettings().dailyBudget, 45.50);

  // Add Expense
  const exp = store.addExpense({
    amount: 12.00,
    category: 'Food & Drinks',
    date: '2026-10-10',
    description: 'Sandwich'
  });
  assert.ok(exp.id);
  assert.equal(store.getExpenses().length, 1);
  assert.equal(store.getExpenses()[0].amount, 12.00);

  // Update Expense
  store.updateExpense(exp.id, {
    amount: 14.50,
    category: 'Food & Drinks',
    date: '2026-10-10',
    description: 'Sandwich and coffee'
  });
  assert.equal(store.getExpenses()[0].amount, 14.50);
  assert.equal(store.getExpenses()[0].description, 'Sandwich and coffee');

  // Add Saving
  const sav = store.addSaving({
    amount: 50.00,
    date: '2026-10-10',
    description: 'Birthday gift saved'
  });
  assert.ok(sav.id);
  assert.equal(store.getSavings().length, 1);

  // Update Saving
  store.updateSaving(sav.id, {
    amount: 55.00,
    date: '2026-10-10',
    description: 'Updated gift'
  });
  assert.equal(store.getSavings()[0].amount, 55.00);

  // Appearance settings
  store.setTheme('dark');
  store.setBackgroundPreset('slate');
  assert.equal(store.getSettings().theme, 'dark');
  assert.equal(store.getSettings().backgroundPreset, 'slate');

  // Delete Expense
  store.deleteExpense(exp.id);
  assert.equal(store.getExpenses().length, 0);

  // Delete Saving
  store.deleteSaving(sav.id);
  assert.equal(store.getSavings().length, 0);

  // Add data again then deleteAllLocalData
  store.addExpense({ amount: 10, category: 'Transport', date: '2026-10-10' });
  store.addSaving({ amount: 20, date: '2026-10-10' });
  store.deleteAllLocalData();

  // Verify full reset while preserving appearance preferences
  const finalSettings = store.getSettings();
  assert.equal(finalSettings.dailyBudget, null);
  assert.equal(finalSettings.theme, 'dark'); // preserved!
  assert.equal(finalSettings.backgroundPreset, 'slate'); // preserved!
  assert.equal(store.getExpenses().length, 0);
  assert.equal(store.getSavings().length, 0);
});
