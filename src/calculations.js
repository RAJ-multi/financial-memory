import { FIXED_CATEGORIES } from './config.js';

export function round2(val) {
  return Math.round((Number(val) + Number.EPSILON) * 100) / 100;
}

export function formatCurrency(amount) {
  const num = round2(amount);
  const isNegative = num < 0;
  const abs = Math.abs(num).toFixed(2);
  return isNegative ? `-$${abs}` : `$${abs}`;
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
