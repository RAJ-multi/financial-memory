export const FIXED_CATEGORIES = [
  'Food & Drinks',
  'Transport',
  'Education',
  'Shopping',
  'Entertainment',
  'Bills & Utilities',
  'Health',
  'Other'
];

export const CATEGORY_COLORS = {
  'Food & Drinks': '#3b82f6',
  'Transport': '#10b981',
  'Education': '#8b5cf6',
  'Shopping': '#ec4899',
  'Entertainment': '#f59e0b',
  'Bills & Utilities': '#06b6d4',
  'Health': '#ef4444',
  'Other': '#64748b'
};

export const STORAGE_KEY = 'financial_memory_db_v1';

export const SUPPORTED_CURRENCIES = [
  { code: 'USD', name: 'US Dollar' },
  { code: 'EUR', name: 'Euro' },
  { code: 'GBP', name: 'British Pound' },
  { code: 'INR', name: 'Indian Rupee' },
  { code: 'CAD', name: 'Canadian Dollar' },
  { code: 'AUD', name: 'Australian Dollar' },
  { code: 'JPY', name: 'Japanese Yen' },
  { code: 'CNY', name: 'Chinese Yuan' },
  { code: 'CHF', name: 'Swiss Franc' },
  { code: 'SGD', name: 'Singapore Dollar' },
  { code: 'BDT', name: 'Bangladeshi Taka' },
  { code: 'NZD', name: 'New Zealand Dollar' }
];

export const DEFAULT_CURRENCY = 'USD';

export const DEFAULT_SETTINGS = {
  dailyBudget: null,
  theme: 'system',
  backgroundPreset: 'default',
  currency: DEFAULT_CURRENCY
};
