import { FIXED_CATEGORIES, CATEGORY_COLORS, SUPPORTED_CURRENCIES } from './config.js';
import {
  formatCurrency,
  round2,
  getTodaySpending,
  getRemainingDailyBudget,
  getAllTimeSavingsTotal,
  getCurrentMonthSummary,
  getTodayDateString,
  getCurrentYearMonthString,
  getCurrentYearString,
  getPeriodSummary,
  getHistoricalComparison
} from './calculations.js';
import { formatPeriodLabel } from './chart-export.js';

export function renderCategoryChart(categoryBreakdown, totalSpending, label = 'Total Spend') {
  if (totalSpending <= 0) {
    return `
      <div class="empty-state" style="padding: 2rem 1rem;">
        <div class="empty-title">No expenses recorded for this period</div>
        <div class="empty-desc">When you record purchases for this period, they will appear here in the category breakdown chart.</div>
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
          <text x="${center}" y="${center - 6}" text-anchor="middle" font-size="11" fill="var(--text-muted)">${escapeHtml(label)}</text>
          <text x="${center}" y="${center + 14}" text-anchor="middle" font-size="14" font-weight="700" fill="var(--text-primary)">${formatCurrency(totalSpending)}</text>
        </svg>
      </div>
      <div class="chart-legend">
        ${legendItems}
      </div>
    </div>
  `;
}

export function renderComparisonBarChart(comparisonData) {
  const { items, maxTotal, totalSpending, periodType, parentKey } = comparisonData;

  if (!items || items.length === 0 || totalSpending <= 0) {
    return `
      <div class="empty-state" style="padding: 2.5rem 1rem;">
        <div class="empty-title">No spending recorded in this comparison period</div>
        <div class="empty-desc">When purchases are recorded for this timeframe, they will appear here in the historical comparison bar chart.</div>
      </div>
    `;
  }

  const svgWidth = 720;
  const svgHeight = 260;
  const topPad = 35;
  const leftPad = 65;
  const rightPad = 25;
  const bottomPad = 45;
  const chartWidth = svgWidth - leftPad - rightPad;
  const chartHeight = svgHeight - topPad - bottomPad;

  const chartMax = maxTotal > 0 ? maxTotal * 1.15 : 100;
  const count = items.length;
  const step = chartWidth / count;
  const barWidth = Math.max(6, Math.min(38, step * 0.68));

  // Y-axis gridlines
  const yTicks = [0, chartMax * 0.33, chartMax * 0.66, chartMax];
  const gridlines = yTicks.map(val => {
    const y = topPad + chartHeight - (val / chartMax) * chartHeight;
    return `
      <g>
        <line x1="${leftPad}" y1="${y}" x2="${svgWidth - rightPad}" y2="${y}" stroke="var(--border-color)" stroke-dasharray="3 3" opacity="0.6" />
        <text x="${leftPad - 8}" y="${y + 4}" font-size="10" fill="var(--text-muted)" text-anchor="end">${escapeHtml(formatCurrency(val))}</text>
      </g>
    `;
  }).join('');

  // Bars
  const bars = items.map((item, idx) => {
    const x = leftPad + idx * step + (step - barWidth) / 2;
    const barH = item.total > 0 ? Math.max(4, (item.total / chartMax) * chartHeight) : 2;
    const y = topPad + chartHeight - barH;
    const isPeak = maxTotal > 0 && item.total === maxTotal;

    const fillColor = item.total > 0
      ? (isPeak ? 'url(#barGradientPeak)' : 'url(#barGradientNormal)')
      : 'var(--border-color)';

    const showLabel = periodType !== 'day' || count <= 16 || idx % 2 === 0 || idx === count - 1;

    return `
      <g class="bar-group">
        <rect
          x="${x}"
          y="${y}"
          width="${barWidth}"
          height="${barH}"
          rx="3"
          ry="3"
          fill="${fillColor}"
          class="chart-bar ${isPeak ? 'bar-peak' : ''}"
        >
          <title>${escapeHtml(item.fullLabel || item.label)}: ${formatCurrency(item.total)}${isPeak ? ' (Peak spending)' : ''}</title>
        </rect>
        ${item.total > 0 && (count <= 14 || isPeak) ? `
          <text x="${x + barWidth / 2}" y="${y - 6}" font-size="9" font-weight="600" fill="var(--text-secondary)" text-anchor="middle">
            ${escapeHtml(formatCurrency(item.total))}
          </text>
        ` : ''}
        ${showLabel ? `
          <text x="${x + barWidth / 2}" y="${topPad + chartHeight + 16}" font-size="10" fill="var(--text-muted)" text-anchor="middle">
            ${escapeHtml(item.label)}
          </text>
        ` : ''}
      </g>
    `;
  }).join('');

  return `
    <div class="comparison-chart-wrapper">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; flex-wrap: wrap; gap: 0.5rem;">
        <div style="font-size: 0.85rem; color: var(--text-secondary);">
          Total: <strong style="color: var(--text-primary);">${formatCurrency(totalSpending)}</strong> &nbsp;•&nbsp;
          Peak: <strong style="color: var(--accent-primary);">${formatCurrency(maxTotal)}</strong>
        </div>
        <div style="font-size: 0.8rem; color: var(--text-muted);">Hover bars for exact details</div>
      </div>
      <div class="chart-scroll-box">
        <svg viewBox="0 0 ${svgWidth} ${svgHeight}" class="comparison-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id="barGradientNormal" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#38bdf8" />
              <stop offset="100%" stop-color="#2563eb" />
            </linearGradient>
            <linearGradient id="barGradientPeak" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#10b981" />
              <stop offset="100%" stop-color="#059669" />
            </linearGradient>
          </defs>
          ${gridlines}
          <line x1="${leftPad}" y1="${topPad + chartHeight}" x2="${svgWidth - rightPad}" y2="${topPad + chartHeight}" stroke="var(--border-color)" stroke-width="1.5" />
          ${bars}
        </svg>
      </div>
    </div>
  `;
}

export function renderDashboard(data, onNavigate, analyticsState = {}) {
  const todaySpending = getTodaySpending(data.expenses);
  const budgetResult = getRemainingDailyBudget(data.expenses, data.settings.dailyBudget);

  const periodType = analyticsState.periodType || 'month';
  const defaultKey = periodType === 'day'
    ? getTodayDateString()
    : periodType === 'year'
      ? getCurrentYearString()
      : getCurrentYearMonthString();
  const periodKey = analyticsState.periodKey || defaultKey;
  const viewMode = analyticsState.viewMode || 'total';

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
        <div class="card-metric metric-negative">${formatCurrency(0)}</div>
        <div>
          <span class="over-budget-tag">Over budget by ${formatCurrency(budgetResult.over)}</span>
        </div>
        <div class="card-subtitle">Spent ${formatCurrency(budgetResult.todaySpending)} of ${formatCurrency(budgetResult.dailyBudget)} daily target today.</div>
      </div>
    `;
  }

  // Render Analytics Section according to mode
  let chartSectionHtml = '';
  if (viewMode === 'compare') {
    const compData = getHistoricalComparison(data.expenses, periodType, periodKey);
    chartSectionHtml = renderComparisonBarChart(compData);
  } else {
    const summary = getPeriodSummary(data.expenses, periodType, periodKey);
    const label = formatPeriodLabel(periodType, periodKey);
    chartSectionHtml = `
      <div style="margin-bottom: 0.75rem; font-size: 0.9rem; color: var(--text-secondary);">
        Total: <strong style="color: var(--text-primary); font-size: 1.1rem;">${formatCurrency(summary.totalSpending)}</strong>
        &nbsp;•&nbsp; ${summary.expenseCount} expenses recorded
      </div>
      ${renderCategoryChart(summary.categoryBreakdown, summary.totalSpending, label)}
    `;
  }

  // Build Year Select options if in Year mode
  let yearOptionsHtml = '';
  if (periodType === 'year') {
    const currentY = getCurrentYearString();
    const existingYears = (data.expenses || [])
      .filter(e => typeof e.date === 'string' && e.date.length >= 4)
      .map(e => e.date.slice(0, 4));
    const allYears = Array.from(new Set([...existingYears, currentY])).sort();
    yearOptionsHtml = allYears.map(y => `
      <option value="${y}" ${String(periodKey).startsWith(y) ? 'selected' : ''}>${y}</option>
    `).join('');
  }

  return `
    <div class="page-header">
      <div>
        <h1 class="page-title">Dashboard</h1>
        <div class="page-subtitle">Today's spending and historical financial analytics</div>
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

    <!-- Unified Expense Analytics Interface -->
    <div class="card analytics-card" style="margin-bottom: 2rem;">
      <div class="analytics-header">
        <div>
          <h2 style="font-size: 1.2rem; font-weight: 700; color: var(--text-primary);">Expense Analytics</h2>
          <div style="font-size: 0.85rem; color: var(--text-muted); margin-top: 0.15rem;">
            ${formatPeriodLabel(periodType, periodKey)}
          </div>
        </div>

        <div class="analytics-controls">
          <!-- Period Selector -->
          <div style="display: flex; align-items: center; gap: 0.4rem;">
            <label for="analytics-period-select" class="form-label" style="margin-bottom: 0; font-size: 0.8rem;">Period:</label>
            <select class="form-select form-select-sm" id="analytics-period-select" style="width: auto; padding: 0.4rem 0.8rem; font-size: 0.85rem;">
              <option value="month" ${periodType === 'month' ? 'selected' : ''}>Month</option>
              <option value="day" ${periodType === 'day' ? 'selected' : ''}>Day</option>
              <option value="year" ${periodType === 'year' ? 'selected' : ''}>Year</option>
            </select>
          </div>

          <!-- Total vs Compare Mode Toggle -->
          <div class="analytics-mode-group">
            <button type="button" class="btn btn-sm ${viewMode === 'total' ? 'btn-primary' : 'btn-secondary'}" id="btn-analytics-total">
              Total Spending
            </button>
            <button type="button" class="btn btn-sm ${viewMode === 'compare' ? 'btn-primary' : 'btn-secondary'}" id="btn-analytics-compare">
              Compare
            </button>
          </div>

          <!-- Export Action -->
          <button type="button" class="btn btn-secondary btn-sm" id="btn-open-export" title="Export pie chart as PNG">
            <span>📊</span> Export
          </button>
        </div>
      </div>

      <!-- Navigation Bar -->
      <div class="analytics-nav-bar">
        <div style="display: flex; align-items: center; gap: 0.4rem;">
          <button type="button" class="btn btn-secondary btn-sm" id="btn-period-prev" title="Previous period" aria-label="Previous period">◀</button>

          ${periodType === 'day' ? `
            <input type="date" class="form-input form-input-sm" id="analytics-date-input" value="${periodKey}" style="width: auto; padding: 0.35rem 0.6rem; font-size: 0.85rem;" />
          ` : periodType === 'year' ? `
            <select class="form-select form-select-sm" id="analytics-year-select" style="width: auto; padding: 0.35rem 0.6rem; font-size: 0.85rem;">
              ${yearOptionsHtml}
            </select>
          ` : `
            <input type="month" class="form-input form-input-sm" id="analytics-month-input" value="${periodKey}" style="width: auto; padding: 0.35rem 0.6rem; font-size: 0.85rem;" />
          `}

          <button type="button" class="btn btn-secondary btn-sm" id="btn-period-next" title="Next period" aria-label="Next period">▶</button>
          <button type="button" class="btn btn-secondary btn-sm" id="btn-period-today">Current</button>
        </div>

        <div style="font-size: 0.85rem; color: var(--text-muted);">
          ${viewMode === 'compare'
            ? (periodType === 'day' ? 'Comparing days across month' : (periodType === 'year' ? 'Comparing all recorded years' : 'Comparing 12 months across year'))
            : 'Viewing category distribution'}
        </div>
      </div>

      <div style="margin-top: 1.25rem;">
        ${chartSectionHtml}
      </div>
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

export function renderSettings(data, hasWallpaper = false, wallpaperUrl = null) {
  const currentBudget = data.settings.dailyBudget;
  const currentTheme = data.settings.theme || 'system';
  const currentPreset = data.settings.backgroundPreset || 'default';
  const currentCurrency = data.settings.currency || 'USD';

  return `
    <div class="page-header">
      <div>
        <h1 class="page-title">Settings</h1>
        <div class="page-subtitle">Daily spending target, currency, appearance, and local data controls</div>
      </div>
    </div>

    <div class="card" style="margin-bottom: 1.5rem;">
      <h2 style="font-size: 1.15rem; font-weight: 700; margin-bottom: 0.5rem;">Currency</h2>
      <p style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 1.25rem;">
        Choose the currency used to display all monetary amounts throughout the application.
      </p>

      <div class="form-group" style="max-width: 350px;">
        <label class="form-label" for="settings-currency-select">Display Currency</label>
        <select class="form-select" id="settings-currency-select">
          ${SUPPORTED_CURRENCIES.map(c => `
            <option value="${c.code}" ${currentCurrency === c.code ? 'selected' : ''}>
              ${c.code} — ${c.name}
            </option>
          `).join('')}
        </select>
      </div>
      <p style="font-size: 0.85rem; color: var(--text-muted); line-height: 1.4;">
        Note: Changing currency updates display formatting only. Existing recorded numerical amounts are not converted using exchange rates.
      </p>
    </div>

    <div class="card" style="margin-bottom: 1.5rem;">
      <h2 style="font-size: 1.15rem; font-weight: 700; margin-bottom: 0.5rem;">Daily Spending Target (${currentCurrency})</h2>
      <p style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 1.25rem;">
        An optional spending reference for today's spending. It is a spending target, not a bank balance.
      </p>
      <form id="form-settings-budget">
        <div class="form-group" style="max-width: 300px;">
          <label class="form-label" for="settings-budget-input">Target Amount in ${currentCurrency}</label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            class="form-input"
            id="settings-budget-input"
            placeholder="e.g. 50.00"
            value="${currentBudget !== null ? currentBudget : ''}"
          />
          <div class="form-error" id="settings-budget-error">Please enter a valid positive target.</div>
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

    <div class="card" style="margin-bottom: 1.5rem;">
      <h2 style="font-size: 1.15rem; font-weight: 700; margin-bottom: 0.5rem;">Background Wallpaper</h2>
      <p style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 1.25rem;">
        Choose a custom background image from your device (PNG, JPEG, WebP up to 6MB).
      </p>

      <div class="wallpaper-controls" style="display: flex; flex-direction: column; gap: 1rem; max-width: 480px;">
        <div style="display: flex; gap: 0.75rem; align-items: center; flex-wrap: wrap;">
          <input type="file" id="wallpaper-file-input" accept="image/png, image/jpeg, image/jpg, image/webp" style="display: none;" />
          <button type="button" class="btn btn-primary btn-sm" id="btn-choose-wallpaper">Choose Wallpaper</button>
          <button type="button" class="btn btn-secondary btn-sm" id="btn-remove-wallpaper" style="${hasWallpaper ? '' : 'display: none;'}">Remove Wallpaper</button>
        </div>

        <div class="form-error" id="wallpaper-error" style="display: none;"></div>

        <div id="wallpaper-preview-container" style="${hasWallpaper ? '' : 'display: none;'}">
          <div style="font-size: 0.85rem; font-weight: 600; color: var(--text-secondary); margin-bottom: 0.4rem;">Wallpaper Preview:</div>
          <div class="wallpaper-preview-box">
            <img id="wallpaper-preview-img" src="${hasWallpaper && wallpaperUrl ? wallpaperUrl : ''}" alt="Wallpaper preview" />
          </div>
          <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.35rem;">
            Wallpaper is stored locally in your browser and kept active across sessions.
          </div>
        </div>
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
