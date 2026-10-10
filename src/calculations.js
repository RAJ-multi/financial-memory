import { FIXED_CATEGORIES } from './config.js';

export function round2(val) {
  return Math.round((Number(val) + Number.EPSILON) * 100) / 100;
}

let currentDefaultCurrency = 'USD';

export function setDefaultCurrency(currency) {
  currentDefaultCurrency = (currency || 'USD').toUpperCase();
}

export function getDefaultCurrency() {
  return currentDefaultCurrency;
}

export function formatCurrency(amount, currency = currentDefaultCurrency) {
  const num = round2(amount);
  const code = (currency || currentDefaultCurrency || 'USD').toUpperCase();
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: code
    }).format(num);
  } catch {
    const isNegative = num < 0;
    const abs = Math.abs(num).toFixed(2);
    return isNegative ? `-${code} ${abs}` : `${code} ${abs}`;
  }
}

export function getTodayDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getCurrentYearMonthString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export function getTodayExpenses(expenses = [], todayDate = getTodayDateString()) {
  return expenses.filter(exp => exp.date === todayDate);
}

export function getTodaySpending(expenses = [], todayDate = getTodayDateString()) {
  const todayList = getTodayExpenses(expenses, todayDate);
  const total = todayList.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
  return round2(total);
}

export function getRemainingDailyBudget(expenses = [], dailyBudget = null, todayDate = getTodayDateString()) {
  if (dailyBudget === null || dailyBudget === undefined || isNaN(dailyBudget)) {
    return {
      configured: false,
      dailyBudget: null,
      todaySpending: getTodaySpending(expenses, todayDate),
      remaining: 0,
      over: 0,
      status: 'unconfigured'
    };
  }

  const budget = round2(dailyBudget);
  const todaySpending = getTodaySpending(expenses, todayDate);
  const diff = round2(budget - todaySpending);

  if (diff >= 0) {
    return {
      configured: true,
      dailyBudget: budget,
      todaySpending,
      remaining: diff,
      over: 0,
      status: 'under'
    };
  } else {
    return {
      configured: true,
      dailyBudget: budget,
      todaySpending,
      remaining: 0,
      over: Math.abs(diff),
      status: 'over'
    };
  }
}

export function getAllTimeSavingsTotal(expenses = [], savings = []) {
  const totalSavings = savings.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
  const totalExpenses = expenses.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
  const balance = round2(totalSavings - totalExpenses);

  return {
    totalSavings: round2(totalSavings),
    totalExpenses: round2(totalExpenses),
    balance,
    countSavings: savings.length,
    countExpenses: expenses.length
  };
}

export function getCurrentMonthExpenses(expenses = [], yearMonth = getCurrentYearMonthString()) {
  return expenses.filter(exp => typeof exp.date === 'string' && exp.date.startsWith(yearMonth));
}

export function getCurrentMonthSummary(expenses = [], yearMonth = getCurrentYearMonthString()) {
  const monthExpenses = getCurrentMonthExpenses(expenses, yearMonth);
  const totalSpending = round2(monthExpenses.reduce((acc, curr) => acc + Number(curr.amount || 0), 0));

  // Category totals for all 8 fixed categories
  const categoryTotals = {};
  for (const cat of FIXED_CATEGORIES) {
    categoryTotals[cat] = 0;
  }
  for (const exp of monthExpenses) {
    const cat = FIXED_CATEGORIES.includes(exp.category) ? exp.category : 'Other';
    categoryTotals[cat] = round2(categoryTotals[cat] + Number(exp.amount || 0));
  }

  // Category breakdown with percentages
  const categoryBreakdown = FIXED_CATEGORIES.map(category => {
    const amount = categoryTotals[category];
    const percentage = totalSpending > 0 ? round2((amount / totalSpending) * 100) : 0;
    return {
      category,
      amount,
      percentage
    };
  });

  // Group by date
  const dateMap = {};
  for (const exp of monthExpenses) {
    if (!dateMap[exp.date]) {
      dateMap[exp.date] = { date: exp.date, total: 0, expenses: [] };
    }
    dateMap[exp.date].total = round2(dateMap[exp.date].total + Number(exp.amount || 0));
    dateMap[exp.date].expenses.push(exp);
  }

  const daysList = Object.values(dateMap).sort((a, b) => b.date.localeCompare(a.date));

  // Highest spending category
  let maxCatAmount = 0;
  let highestCategories = [];
  for (const item of categoryBreakdown) {
    if (item.amount > 0) {
      if (item.amount > maxCatAmount) {
        maxCatAmount = item.amount;
        highestCategories = [item.category];
      } else if (item.amount === maxCatAmount) {
        highestCategories.push(item.category);
      }
    }
  }

  // Highest spending day
  let maxDayAmount = 0;
  let highestDays = [];
  for (const dayItem of daysList) {
    if (dayItem.total > 0) {
      if (dayItem.total > maxDayAmount) {
        maxDayAmount = dayItem.total;
        highestDays = [dayItem.date];
      } else if (dayItem.total === maxDayAmount) {
        highestDays.push(dayItem.date);
      }
    }
  }

  return {
    yearMonth,
    totalSpending,
    expenseCount: monthExpenses.length,
    categoryBreakdown,
    daysList,
    highestCategoryResult: {
      hasData: highestCategories.length > 0,
      isTie: highestCategories.length > 1,
      categories: highestCategories,
      amount: maxCatAmount,
      percentage: totalSpending > 0 ? round2((maxCatAmount / totalSpending) * 100) : 0
    },
    highestDayResult: {
      hasData: highestDays.length > 0,
      isTie: highestDays.length > 1,
      dates: highestDays,
      amount: maxDayAmount
    }
  };
}

export function getCurrentYearString() {
  return String(new Date().getFullYear());
}

export function getExpensesByPeriod(expenses = [], periodType = 'month', periodKey = '') {
  // Only process expenses, ignore any savings entries
  const actualExpenses = expenses.filter(e => e && e.type !== 'saving');

  if (periodType === 'day') {
    const targetDay = periodKey || getTodayDateString();
    return actualExpenses.filter(e => typeof e.date === 'string' && e.date === targetDay);
  }

  if (periodType === 'year') {
    const targetYear = String(periodKey || getCurrentYearString()).slice(0, 4);
    return actualExpenses.filter(e => typeof e.date === 'string' && e.date.startsWith(targetYear));
  }

  // default 'month'
  const targetMonth = String(periodKey || getCurrentYearMonthString()).slice(0, 7);
  return actualExpenses.filter(e => typeof e.date === 'string' && e.date.startsWith(targetMonth));
}

export function getPeriodSummary(expenses = [], periodType = 'month', periodKey = '') {
  const periodExpenses = getExpensesByPeriod(expenses, periodType, periodKey);
  const totalSpending = round2(periodExpenses.reduce((acc, curr) => acc + Number(curr.amount || 0), 0));

  const categoryTotals = {};
  for (const cat of FIXED_CATEGORIES) {
    categoryTotals[cat] = 0;
  }
  for (const exp of periodExpenses) {
    const cat = FIXED_CATEGORIES.includes(exp.category) ? exp.category : 'Other';
    categoryTotals[cat] = round2(categoryTotals[cat] + Number(exp.amount || 0));
  }

  const categoryBreakdown = FIXED_CATEGORIES.map(category => {
    const amount = categoryTotals[category];
    const percentage = totalSpending > 0 ? round2((amount / totalSpending) * 100) : 0;
    return {
      category,
      amount,
      percentage
    };
  });

  return {
    periodType,
    periodKey,
    totalSpending,
    expenseCount: periodExpenses.length,
    categoryBreakdown,
    hasData: periodExpenses.length > 0
  };
}

export function getHistoricalComparison(expenses = [], periodType = 'month', periodKey = '') {
  // Exclude savings records
  const actualExpenses = expenses.filter(e => e && e.type !== 'saving');

  if (periodType === 'day') {
    // Compare daily spending across a selected month
    const monthKey = String(periodKey || getCurrentYearMonthString()).slice(0, 7);
    const [year, month] = monthKey.split('-').map(Number);
    const daysCount = new Date(year, month, 0).getDate();
    const monthExpenses = actualExpenses.filter(e => typeof e.date === 'string' && e.date.startsWith(monthKey));

    const items = [];
    let maxTotal = 0;
    let sumTotal = 0;

    for (let d = 1; d <= daysCount; d++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayTotal = round2(
        monthExpenses.filter(e => e.date === dateStr).reduce((acc, curr) => acc + Number(curr.amount || 0), 0)
      );
      if (dayTotal > maxTotal) maxTotal = dayTotal;
      sumTotal = round2(sumTotal + dayTotal);
      items.push({
        key: dateStr,
        label: String(d),
        fullLabel: dateStr,
        total: dayTotal
      });
    }

    return {
      periodType: 'day',
      parentKey: monthKey,
      items,
      maxTotal,
      totalSpending: sumTotal,
      hasData: sumTotal > 0
    };
  }

  if (periodType === 'year') {
    // Compare annual spending across all years for which expense records exist
    const currentYear = getCurrentYearString();
    const existingYears = actualExpenses
      .filter(e => typeof e.date === 'string' && e.date.length >= 4)
      .map(e => e.date.slice(0, 4));

    const allYears = Array.from(new Set([...existingYears, currentYear])).sort();

    const items = [];
    let maxTotal = 0;
    let sumTotal = 0;

    for (const y of allYears) {
      const yearTotal = round2(
        actualExpenses.filter(e => typeof e.date === 'string' && e.date.startsWith(y)).reduce((acc, curr) => acc + Number(curr.amount || 0), 0)
      );
      if (yearTotal > maxTotal) maxTotal = yearTotal;
      sumTotal = round2(sumTotal + yearTotal);
      items.push({
        key: y,
        label: y,
        fullLabel: `Year ${y}`,
        total: yearTotal
      });
    }

    return {
      periodType: 'year',
      parentKey: 'all',
      items,
      maxTotal,
      totalSpending: sumTotal,
      hasData: sumTotal > 0
    };
  }

  // Default 'month' mode: compare monthly spending across a selected year
  const yearKey = String(periodKey || getCurrentYearString()).slice(0, 4);
  const yearExpenses = actualExpenses.filter(e => typeof e.date === 'string' && e.date.startsWith(yearKey));
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const items = [];
  let maxTotal = 0;
  let sumTotal = 0;

  for (let m = 1; m <= 12; m++) {
    const monthKey = `${yearKey}-${String(m).padStart(2, '0')}`;
    const monthTotal = round2(
      yearExpenses.filter(e => e.date.startsWith(monthKey)).reduce((acc, curr) => acc + Number(curr.amount || 0), 0)
    );
    if (monthTotal > maxTotal) maxTotal = monthTotal;
    sumTotal = round2(sumTotal + monthTotal);
    items.push({
      key: monthKey,
      label: monthNames[m - 1],
      fullLabel: `${monthNames[m - 1]} ${yearKey}`,
      total: monthTotal
    });
  }

    return {
      periodType: 'month',
      parentKey: yearKey,
      items,
      maxTotal,
      totalSpending: sumTotal,
      hasData: sumTotal > 0
    };
  }

export function getPreviousPeriodKey(periodType, periodKey) {
  if (periodType === 'day') {
    const parts = String(periodKey || getTodayDateString()).split('-').map(Number);
    const date = new Date(parts[0], parts[1] - 1, parts[2]);
    date.setDate(date.getDate() - 1);
    const prevY = date.getFullYear();
    const prevM = String(date.getMonth() + 1).padStart(2, '0');
    const prevD = String(date.getDate()).padStart(2, '0');
    return `${prevY}-${prevM}-${prevD}`;
  }
  if (periodType === 'month') {
    const parts = String(periodKey || getCurrentYearMonthString()).split('-').map(Number);
    const date = new Date(parts[0], parts[1] - 1, 1);
    date.setMonth(date.getMonth() - 1);
    const prevY = date.getFullYear();
    const prevM = String(date.getMonth() + 1).padStart(2, '0');
    return `${prevY}-${prevM}`;
  }
  const y = parseInt(periodKey || getCurrentYearString(), 10);
  return String(y - 1);
}

export function getNextPeriodKey(periodType, periodKey) {
  if (periodType === 'day') {
    const parts = String(periodKey || getTodayDateString()).split('-').map(Number);
    const date = new Date(parts[0], parts[1] - 1, parts[2]);
    date.setDate(date.getDate() + 1);
    const nextY = date.getFullYear();
    const nextM = String(date.getMonth() + 1).padStart(2, '0');
    const nextD = String(date.getDate()).padStart(2, '0');
    return `${nextY}-${nextM}-${nextD}`;
  }
  if (periodType === 'month') {
    const parts = String(periodKey || getCurrentYearMonthString()).split('-').map(Number);
    const date = new Date(parts[0], parts[1] - 1, 1);
    date.setMonth(date.getMonth() + 1);
    const nextY = date.getFullYear();
    const nextM = String(date.getMonth() + 1).padStart(2, '0');
    return `${nextY}-${nextM}`;
  }
  const y = parseInt(periodKey || getCurrentYearString(), 10);
  return String(y + 1);
}
