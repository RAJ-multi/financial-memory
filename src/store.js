import { STORAGE_KEY, DEFAULT_SETTINGS, FIXED_CATEGORIES } from './config.js';
import { round2 } from './calculations.js';

// In-memory fallback for testing in Node.js
let memoryStorage = null;

function getStorage() {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage;
  }
  return {
    getItem: (key) => memoryStorage,
    setItem: (key, val) => { memoryStorage = val; },
    removeItem: (key) => { memoryStorage = null; }
  };
}

export function generateId(prefix = 'item') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

class Store {
  constructor() {
    this.listeners = [];
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notify() {
    for (const listener of this.listeners) {
      try {
        listener(this.getData());
      } catch (err) {
        console.error('Error in store listener:', err);
      }
    }
  }

  getData() {
    const storage = getStorage();
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial = {
        version: 1,
        settings: { ...DEFAULT_SETTINGS },
        expenses: [],
        savings: []
      };
      this.saveData(initial);
      return initial;
    }
    try {
      const parsed = JSON.parse(raw);
      if (!parsed.settings) parsed.settings = { ...DEFAULT_SETTINGS };
      if (!parsed.settings.currency) parsed.settings.currency = 'USD';
      if (!Array.isArray(parsed.expenses)) parsed.expenses = [];
      if (!Array.isArray(parsed.savings)) parsed.savings = [];
      return parsed;
    } catch {
      const reset = {
        version: 1,
        settings: { ...DEFAULT_SETTINGS },
        expenses: [],
        savings: []
      };
      this.saveData(reset);
      return reset;
    }
  }

  saveData(data) {
    const storage = getStorage();
    storage.setItem(STORAGE_KEY, JSON.stringify(data));
    this.notify();
  }

  getSettings() {
    return this.getData().settings;
  }

  updateSettings(partial) {
    const data = this.getData();
    data.settings = { ...data.settings, ...partial };
    this.saveData(data);
    return data.settings;
  }

  setDailyBudget(amount) {
    const num = amount === null || amount === '' ? null : round2(amount);
    return this.updateSettings({ dailyBudget: num });
  }

  setTheme(theme) {
    return this.updateSettings({ theme });
  }

  setBackgroundPreset(preset) {
    return this.updateSettings({ backgroundPreset: preset });
  }

  setCurrency(currency) {
    const code = (currency || 'USD').toUpperCase();
    return this.updateSettings({ currency: code });
  }

  getExpenses() {
    return this.getData().expenses;
  }

  addExpense({ amount, category, date, description = '' }) {
    if (!amount || Number(amount) <= 0) {
      throw new Error('Expense amount must be a positive number.');
    }
    if (!category || !FIXED_CATEGORIES.includes(category)) {
      throw new Error('Valid expense category is required.');
    }
    if (!date) {
      throw new Error('Expense date is required.');
    }

    const data = this.getData();
    const newExpense = {
      id: generateId('exp'),
      type: 'expense',
      amount: round2(amount),
      category,
      date,
      description: description.trim(),
      createdAt: Date.now()
    };
    data.expenses.push(newExpense);
    this.saveData(data);
    return newExpense;
  }

  updateExpense(id, { amount, category, date, description = '' }) {
    if (!amount || Number(amount) <= 0) {
      throw new Error('Expense amount must be a positive number.');
    }
    if (!category || !FIXED_CATEGORIES.includes(category)) {
      throw new Error('Valid expense category is required.');
    }
    if (!date) {
      throw new Error('Expense date is required.');
    }

    const data = this.getData();
    const idx = data.expenses.findIndex(e => e.id === id);
    if (idx === -1) {
      throw new Error('Expense not found.');
    }
    data.expenses[idx] = {
      ...data.expenses[idx],
      amount: round2(amount),
      category,
      date,
      description: description.trim()
    };
    this.saveData(data);
    return data.expenses[idx];
  }

  deleteExpense(id) {
    const data = this.getData();
    const initialLen = data.expenses.length;
    data.expenses = data.expenses.filter(e => e.id !== id);
    if (data.expenses.length !== initialLen) {
      this.saveData(data);
      return true;
    }
    return false;
  }

  getSavings() {
    return this.getData().savings;
  }

  addSaving({ amount, date, description = '' }) {
    if (!amount || Number(amount) <= 0) {
      throw new Error('Saving contribution amount must be a positive number.');
    }
    if (!date) {
      throw new Error('Saving contribution date is required.');
    }

    const data = this.getData();
    const newSaving = {
      id: generateId('sav'),
      type: 'saving',
      amount: round2(amount),
      date,
      description: description.trim(),
      createdAt: Date.now()
    };
    data.savings.push(newSaving);
    this.saveData(data);
    return newSaving;
  }

  updateSaving(id, { amount, date, description = '' }) {
    if (!amount || Number(amount) <= 0) {
      throw new Error('Saving contribution amount must be a positive number.');
    }
    if (!date) {
      throw new Error('Saving contribution date is required.');
    }

    const data = this.getData();
    const idx = data.savings.findIndex(s => s.id === id);
    if (idx === -1) {
      throw new Error('Saving contribution not found.');
    }
    data.savings[idx] = {
      ...data.savings[idx],
      amount: round2(amount),
      date,
      description: description.trim()
    };
    this.saveData(data);
    return data.savings[idx];
  }

  deleteSaving(id) {
    const data = this.getData();
    const initialLen = data.savings.length;
    data.savings = data.savings.filter(s => s.id !== id);
    if (data.savings.length !== initialLen) {
      this.saveData(data);
      return true;
    }
    return false;
  }

  deleteAllLocalData() {
    const current = this.getData();
    // Preserves appearance and currency preferences
    const preservedTheme = current.settings?.theme || 'system';
    const preservedBackground = current.settings?.backgroundPreset || 'default';
    const preservedCurrency = current.settings?.currency || 'USD';

    const fresh = {
      version: 1,
      settings: {
        dailyBudget: null,
        theme: preservedTheme,
        backgroundPreset: preservedBackground,
        currency: preservedCurrency
      },
      expenses: [],
      savings: []
    };
    this.saveData(fresh);
    return fresh;
  }
}

export const store = new Store();
