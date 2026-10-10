import { CATEGORY_COLORS } from './config.js';
import { formatCurrency, getPeriodSummary } from './calculations.js';

export function formatPeriodLabel(periodType, periodKey) {
  if (periodType === 'day') {
    const [y, m, d] = periodKey.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    return dateObj.toLocaleDateString('default', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
  if (periodType === 'month') {
    const [y, m] = periodKey.split('-').map(Number);
    const dateObj = new Date(y, m - 1, 1);
    return dateObj.toLocaleDateString('default', {
      year: 'numeric',
      month: 'long'
    });
  }
  return `Year ${periodKey}`;
}

export function generateChartCanvas({ expenses, periodType, periodKey, currency }) {
  if (typeof document === 'undefined') {
    return null;
  }

  const summary = getPeriodSummary(expenses, periodType, periodKey);
  const periodLabel = formatPeriodLabel(periodType, periodKey);

  const canvas = document.createElement('canvas');
  const width = 1000;
  const height = 660;
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, width, height);

  // Decorative border
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 2;
  ctx.strokeRect(20, 20, width - 40, height - 40);

  // Header Brand & Title
  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('FINANCIAL MEMORY', 50, 60);

  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 26px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('Expense Distribution by Category', 50, 95);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(`Period: ${periodLabel} • Total Spending: ${formatCurrency(summary.totalSpending, currency)} (${summary.expenseCount} entries)`, 50, 125);

  // Separator line
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(50, 145);
  ctx.lineTo(width - 50, 145);
  ctx.stroke();

  // If no data
  if (summary.totalSpending <= 0) {
    ctx.fillStyle = '#64748b';
    ctx.font = '18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('No recorded expenses found for this reporting period.', width / 2, height / 2);
    ctx.font = '14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText('Only actual non-zero expense records are included in category charts.', width / 2, height / 2 + 30);
    ctx.textAlign = 'left';
    return canvas;
  }

  // Draw Donut Chart
  const centerX = 280;
  const centerY = 390;
  const outerRadius = 170;
  const innerRadius = 95;
  const activeCategories = summary.categoryBreakdown.filter(c => c.amount > 0);

  let currentAngle = -Math.PI / 2;

  activeCategories.forEach(cat => {
    const sliceAngle = (cat.amount / summary.totalSpending) * (2 * Math.PI);
    const color = CATEGORY_COLORS[cat.category] || '#64748b';

    ctx.beginPath();
    ctx.arc(centerX, centerY, outerRadius, currentAngle, currentAngle + sliceAngle);
    ctx.arc(centerX, centerY, innerRadius, currentAngle + sliceAngle, currentAngle, true);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();

    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 3;
    ctx.stroke();

    currentAngle += sliceAngle;
  });

  // Center hole text
  ctx.textAlign = 'center';
  ctx.fillStyle = '#94a3b8';
  ctx.font = '13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('TOTAL EXPENSE', centerX, centerY - 10);

  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 22px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(formatCurrency(summary.totalSpending, currency), centerX, centerY + 20);
  ctx.textAlign = 'left';

  // Draw Legend on Right
  const legendX = 540;
  let legendY = 200;
  const itemHeight = 44;

  ctx.fillStyle = '#f1f5f9';
  ctx.font = 'bold 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('Category Breakdown', legendX, legendY);
  legendY += 28;

  activeCategories.forEach(cat => {
    const color = CATEGORY_COLORS[cat.category] || '#64748b';

    // Color pill
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(legendX, legendY, 14, 14, 3) : ctx.rect(legendX, legendY, 14, 14);
    ctx.fill();

    // Category name
    ctx.fillStyle = '#e2e8f0';
    ctx.font = '500 15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(cat.category, legendX + 26, legendY + 12);

    // Amount & percent
    const amountText = `${formatCurrency(cat.amount, currency)} (${cat.percentage}%)`;
    ctx.fillStyle = '#94a3b8';
    ctx.font = '600 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(amountText, width - 60, legendY + 12);
    ctx.textAlign = 'left';

    legendY += itemHeight;
  });

  // Footer branding
  ctx.fillStyle = '#64748b';
  ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('Exported from Financial Memory • Local-first, private, and deterministic', 50, height - 35);

  return canvas;
}

export function exportExpenseChartPNG({ expenses, periodType, periodKey, currency }) {
  if (typeof document === 'undefined') {
    return false;
  }
  const canvas = generateChartCanvas({ expenses, periodType, periodKey, currency });
  if (!canvas) return false;

  const fileName = `financial-memory-chart-${periodType}-${periodKey}.png`;

  if (canvas.toBlob) {
    canvas.toBlob(blob => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    }, 'image/png');
    return true;
  } else {
    const dataUrl = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    return true;
  }
}
