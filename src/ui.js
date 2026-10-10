import { FIXED_CATEGORIES, CATEGORY_COLORS } from './config.js';
import {
  formatCurrency,
  round2,
  getTodaySpending,
  getRemainingDailyBudget,
  getAllTimeSavingsTotal,
  getCurrentMonthSummary,
  getTodayDateString,
  getCurrentYearMonthString
} from './calculations.js';

export function renderCategoryChart(categoryBreakdown, totalSpending) {
  if (totalSpending <= 0) {
    return `
      <div class="empty-state" style="padding: 2rem 1rem;">
        <div class="empty-title">No expenses this month yet</div>
        <div class="empty-desc">Recorded expenses for this month will appear here in the category chart.</div>
      </div>
    `;
  }

  // Generate SVG Donut
  const activeCategories = categoryBreakdown.filter(c => c.amount > 0);
  let cumulativeAngle = 0;
  const radius = 60;
  const strokeWidth = 24;
  const center = 80;
  const circumference = 2 * Math.PI * radius;

  const svgSlices = activeCategories.map(cat => {
    const fraction = cat.amount / totalSpending;
    const strokeDasharray = `${fraction * circumference} ${circumference}`;
    const strokeDashoffset = -cumulativeAngle * circumference;
    cumulativeAngle += fraction;
    const color = CATEGORY_COLORS[cat.category] || '#64748b';

    return `
      <circle
        cx="${center}"
        cy="${center}"
        r="${radius}"
        fill="transparent"
        stroke="${color}"
        stroke-width="${strokeWidth}"
        stroke-dasharray="${strokeDasharray}"
        stroke-dashoffset="${strokeDashoffset}"
        transform="rotate(-90 ${center} ${center})"
      >
        <title>${cat.category}: ${formatCurrency(cat.amount)} (${cat.percentage}%)</title>
      </circle>
    `;
  }).join('');

  const legendItems = activeCategories.map(cat => {
    const color = CATEGORY_COLORS[cat.category] || '#64748b';
    return `
      <div class="legend-item">
        <div>
          <span class="legend-color-dot" style="background-color: ${color}"></span>
          <span style="font-weight: 500;">${cat.category}</span>
        </div>
        <div style="font-weight: 600;">
          ${formatCurrency(cat.amount)} <span style="font-weight: normal; font-size: 0.8rem; color: var(--text-muted);">(${cat.percentage}%)</span>
        </div>
      </div>
    `;
  }).join('');

  return `
    <div class="chart-container">
      <div class="chart-visual-wrapper">
        <svg width="160" height="160" viewBox="0 0 160 160">
          <circle cx="${center}" cy="${center}" r="${radius}" fill="transparent" stroke="var(--border-color)" stroke-width="${strokeWidth}" />
          ${svgSlices}
          <text x="${center}" y="${center - 6}" text-anchor="middle" font-size="11" fill="var(--text-muted)">Month Spend</text>
          <text x="${center}" y="${center + 14}" text-anchor="middle" font-size="14" font-weight="700" fill="var(--text-primary)">${formatCurrency(totalSpending)}</text>
        </svg>
      </div>
      <div class="chart-legend">
        ${legendItems}
      </div>
    </div>
  `;
}

export function renderDashboard(data, onNavigate) {
  const todaySpending = getTodaySpending(data.expenses);
  const budgetResult = getRemainingDailyBudget(data.expenses, data.settings.dailyBudget);
  const monthSummary = getCurrentMonthSummary(data.expenses);

  let budgetCardContent = '';
  if (!budgetResult.configured) {
    budgetCardContent = `
      <div class="card">
        <div class="card-title">Daily Spending Target</div>
        <div class="card-metric" style="font-size: 1.5rem; color: var(--text-muted);">None set</div>
        <div class="card-subtitle">Set a spending reference to track today's daily remaining target.</div>
        <button class="btn btn-secondary btn-sm" id="btn-quick-set-budget" style="margin-top: 1rem;">Set a daily budget</button>
      </div>
    `;
  } else if (budgetResult.status === 'under') {
    budgetCardContent = `
      <div class="card">
        <div class="card-title">Remaining Daily Budget</div>
        <div class="card-metric metric-positive">${formatCurrency(budgetResult.remaining)}</div>
        <div>
          <span class="under-budget-tag">Under target (${formatCurrency(budgetResult.dailyBudget)} daily)</span>
        </div>
        <div class="card-subtitle">Reflects recorded expenses dated today.</div>
      </div>
    `;
  } else {
    budgetCardContent = `
      <div class="card" style="border-color: var(--danger);">
        <div class="card-title">Remaining Daily Budget</div>
        <div class="card-metric metric-negative">$0.00</div>
        <div>
          <span class="over-budget-tag">Over budget by ${formatCurrency(budgetResult.over)}</span>
        </div>
        <div class="card-subtitle">Spent ${formatCurrency(budgetResult.todaySpending)} of ${formatCurrency(budgetResult.dailyBudget)} daily target today.</div>
      </div>
    `;
  }

  const chartSection = renderCategoryChart(monthSummary.categoryBreakdown, monthSummary.totalSpending);

  return `
    <div class="page-header">
      <div>
        <h1 class="page-title">Dashboard</h1>
        <div class="page-subtitle">Today's spending and this month's financial context</div>
      </div>
      <div>
        <button class="btn btn-primary" id="btn-open-add-expense" style="padding: 0.75rem 1.5rem; font-size: 1rem;">
          + Add Expense
        </button>
      </div>
    </div>

    <div class="card-grid">
      <div class="card">
        <div class="card-title">Today's Recorded Spending</div>
        <div class="card-metric">${formatCurrency(todaySpending)}</div>
        <div class="card-subtitle">Expenses dated today (${getTodayDateString()})</div>
      </div>
      ${budgetCardContent}
    </div>

    <div class="card" style="margin-bottom: 2rem;">
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.25rem;">
        <h2 style="font-size: 1.15rem; font-weight: 700;">Current Month Spending Categories</h2>
        <button class="btn btn-secondary btn-sm" id="btn-view-month-history">View Monthly History</button>
      </div>
      ${chartSection}
    </div>
  `;
}

export function renderMonthlyHistory(data, onEditExpense, onDeleteExpense) {
  const summary = getCurrentMonthSummary(data.expenses);
  const now = new Date();
  const monthName = now.toLocaleString('default', { month: 'long', year: 'numeric' });

  if (summary.expenseCount === 0) {
    return `
      <div class="page-header">
        <div>
          <h1 class="page-title">Monthly History</h1>
          <div class="page-subtitle">${monthName}</div>
        </div>
        <button class="btn btn-primary" id="btn-open-add-expense">+ Add Expense</button>
      </div>
      <div class="empty-state">
        <div class="empty-icon">📅</div>
        <div class="empty-title">No recorded expenses for ${monthName}</div>
        <div class="empty-desc">When you record purchases this month, they will appear here with daily breakdowns and category totals.</div>
        <button class="btn btn-primary" id="btn-add-first-expense">Add your first expense</button>
      </div>
    `;
  }

  const categoryLegend = summary.categoryBreakdown
    .filter(c => c.amount > 0)
    .map(c => `
      <div class="legend-item">
        <div>
          <span class="legend-color-dot" style="background-color: ${CATEGORY_COLORS[c.category]}"></span>
          <span>${c.category}</span>
        </div>
        <div style="font-weight: 600;">${formatCurrency(c.amount)} (${c.percentage}%)</div>
      </div>
    `).join('');

  const daysHtml = summary.daysList.map(dayItem => {
    const isHighest = summary.highestDayResult.dates.includes(dayItem.date);
    const badge = isHighest ? `<span class="highest-day-badge">Highest Day</span>` : '';

    const expensesHtml = dayItem.expenses.map(exp => `
      <div class="transaction-item">
        <div class="tx-main">
          <div class="tx-category">${exp.category}</div>
          ${exp.description ? `<div class="tx-description">${escapeHtml(exp.description)}</div>` : ''}
        </div>
        <div class="tx-amount">${formatCurrency(exp.amount)}</div>
        <div class="tx-actions">
          <button class="btn btn-secondary btn-sm btn-edit-exp" data-id="${exp.id}">Edit</button>
          <button class="btn btn-secondary btn-sm btn-del-exp" data-id="${exp.id}" style="color: var(--danger);">Delete</button>
        </div>
      </div>
    `).join('');

    return `
      <div class="transaction-group">
        <div class="group-date-header">
          <div>
            <span>${dayItem.date}</span>
            ${badge}
          </div>
          <div>Day Total: ${formatCurrency(dayItem.total)}</div>
        </div>
        ${expensesHtml}
      </div>
    `;
  }).join('');

  return `
    <div class="page-header">
      <div>
        <h1 class="page-title">Monthly History</h1>
        <div class="page-subtitle">${monthName} — Verified records for current month only</div>
      </div>
      <button class="btn btn-primary" id="btn-open-add-expense">+ Add Expense</button>
    </div>

    <div class="card" style="margin-bottom: 1.5rem;">
      <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 1rem;">
        <span class="card-title">Total Month Expense Spending</span>
        <span class="card-metric">${formatCurrency(summary.totalSpending)}</span>
      </div>
      <div class="chart-legend" style="margin-top: 1rem;">
        ${categoryLegend}
      </div>
    </div>

    <div style="margin-top: 1.5rem;">
      <h2 style="font-size: 1.15rem; font-weight: 700; margin-bottom: 1rem;">Daily Expense Records</h2>
      ${daysHtml}
    </div>
  `;
}

export function renderSavings(data, onEditSaving, onDeleteSaving) {
  const savingsResult = getAllTimeSavingsTotal(data.expenses, data.savings);
  const isPositive = savingsResult.balance >= 0;

  const savingsListHtml = data.savings.length === 0
    ? `
      <div class="empty-state" style="margin-top: 1.5rem;">
        <div class="empty-icon">🐷</div>
        <div class="empty-title">No saving contributions recorded</div>
        <div class="empty-desc">Record deposits or savings put aside to track your all-time recorded savings total.</div>
        <button class="btn btn-primary" id="btn-add-first-saving">+ Add Saving</button>
      </div>
    `
    : `
      <div style="margin-top: 1.5rem;">
        <h2 style="font-size: 1.15rem; font-weight: 700; margin-bottom: 1rem;">Contribution History</h2>
        ${data.savings.slice().reverse().map(sav => `
          <div class="transaction-item">
            <div class="tx-main">
              <div class="tx-category">${sav.date}</div>
              ${sav.description ? `<div class="tx-description">${escapeHtml(sav.description)}</div>` : ''}
            </div>
            <div class="tx-amount" style="color: var(--success);">${formatCurrency(sav.amount)}</div>
            <div class="tx-actions">
              <button class="btn btn-secondary btn-sm btn-edit-sav" data-id="${sav.id}">Edit</button>
              <button class="btn btn-secondary btn-sm btn-del-sav" data-id="${sav.id}" style="color: var(--danger);">Delete</button>
            </div>
          </div>
        `).join('')}
      </div>
    `;

  return `
    <div class="page-header">
      <div>
        <h1 class="page-title">Savings</h1>
        <div class="page-subtitle">Track recorded savings contributions against cumulative expenses</div>
      </div>
      <button class="btn btn-primary" id="btn-open-add-saving">+ Add Saving</button>
    </div>

    <div class="card">
      <div class="card-title">All-Time Recorded Total</div>
      <div class="card-metric ${isPositive ? 'metric-positive' : 'metric-negative'}">
        ${formatCurrency(savingsResult.balance)}
      </div>
      <div class="card-subtitle" style="font-size: 0.85rem; line-height: 1.4; margin-top: 0.75rem; color: var(--text-secondary);">
        Recorded savings total — calculated from the savings contributions and expenses you’ve entered. This is not a verified bank balance and may not reflect your actual available money.
      </div>
      <div style="margin-top: 1rem; font-size: 0.85rem; color: var(--text-muted);">
        Total contributions: <strong>${formatCurrency(savingsResult.totalSavings)}</strong> (${savingsResult.countSavings} entries) &nbsp;|&nbsp; 
        Cumulative expenses: <strong>${formatCurrency(savingsResult.totalExpenses)}</strong> (${savingsResult.countExpenses} entries)
      </div>
    </div>

    ${savingsListHtml}
  `;
}

export function renderSettings(data) {
  const currentBudget = data.settings.dailyBudget;
  const currentTheme = data.settings.theme || 'system';
  const currentPreset = data.settings.backgroundPreset || 'default';

  return `
    <div class="page-header">
      <div>
        <h1 class="page-title">Settings</h1>
        <div class="page-subtitle">Daily spending target, appearance, and local data controls</div>
      </div>
    </div>

    <div class="card" style="margin-bottom: 1.5rem;">
      <h2 style="font-size: 1.15rem; font-weight: 700; margin-bottom: 0.5rem;">Daily Spending Target (USD)</h2>
      <p style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 1.25rem;">
        An optional spending reference for today's spending. It is a spending target, not a bank balance.
      </p>
      <form id="form-settings-budget">
        <div class="form-group" style="max-width: 300px;">
          <label class="form-label" for="settings-budget-input">Target Amount in USD</label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            class="form-input"
            id="settings-budget-input"
            placeholder="e.g. 50.00"
            value="${currentBudget !== null ? currentBudget : ''}"
          />
          <div class="form-error" id="settings-budget-error">Please enter a valid positive USD target.</div>
        </div>
        <div style="display: flex; gap: 0.75rem;">
          <button type="submit" class="btn btn-primary btn-sm">Save Budget</button>
          ${currentBudget !== null ? `<button type="button" class="btn btn-secondary btn-sm" id="btn-remove-budget">Remove Budget</button>` : ''}
        </div>
      </form>
    </div>

    <div class="card" style="margin-bottom: 1.5rem;">
      <h2 style="font-size: 1.15rem; font-weight: 700; margin-bottom: 0.5rem;">Appearance</h2>
      <p style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 1.25rem;">
        Customise app theme and background styling.
      </p>

      <div class="form-group" style="max-width: 350px;">
        <label class="form-label">Theme</label>
        <select class="form-select" id="settings-theme-select">
          <option value="system" ${currentTheme === 'system' ? 'selected' : ''}>System Default</option>
          <option value="light" ${currentTheme === 'light' ? 'selected' : ''}>Explicit Light</option>
          <option value="dark" ${currentTheme === 'dark' ? 'selected' : ''}>Explicit Dark</option>
        </select>
      </div>

      <div class="form-group" style="max-width: 350px;">
        <label class="form-label">Preset Background Style</label>
        <select class="form-select" id="settings-preset-select">
          <option value="default" ${currentPreset === 'default' ? 'selected' : ''}>Default (Neutral)</option>
          <option value="slate" ${currentPreset === 'slate' ? 'selected' : ''}>Slate</option>
          <option value="warm" ${currentPreset === 'warm' ? 'selected' : ''}>Warm</option>
          <option value="cool" ${currentPreset === 'cool' ? 'selected' : ''}>Cool</option>
        </select>
      </div>
    </div>

    <div class="card" style="border-color: var(--danger);">
      <h2 style="font-size: 1.15rem; font-weight: 700; margin-bottom: 0.5rem; color: var(--danger);">Local Data & Privacy</h2>
      <p style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 1rem;">
        Financial Memory is local-first. All entries and budgets are stored exclusively in your browser. There are no accounts, cloud sync, or external servers.
      </p>
      <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 1.25rem;">
        Deleting all local data permanently deletes all locally recorded expenses, saving contributions, and the daily budget.
      </p>
      <button class="btn btn-danger btn-sm" id="btn-trigger-delete-all">Delete All Local Data</button>
    </div>
  `;
}

export function escapeHtml(str = '') {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
