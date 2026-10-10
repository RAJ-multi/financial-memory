import { getCurrentMonthSummary, formatCurrency, getCurrentYearMonthString } from './calculations.js';

export const SUPPORTED_QUESTIONS = [
  'Which category has the highest spending this month?',
  'Which day had the highest spending this month?'
];

export function classifyQuestion(queryText = '') {
  const q = queryText.toLowerCase().trim();

  // Category intent patterns
  const categoryPatterns = [
    /highest.*category/,
    /top.*category/,
    /where.*most.*money/,
    /most.*spending.*category/,
    /biggest.*category/,
    /category.*highest/
  ];

  // Day intent patterns
  const dayPatterns = [
    /highest.*day/,
    /top.*day/,
    /which.*day.*most/,
    /which.*day.*highest/,
    /day.*highest.*spending/,
    /biggest.*day/,
    /spend.*most.*day/,
    /most.*expensive.*day/
  ];

  for (const pattern of categoryPatterns) {
    if (pattern.test(q)) return 'HIGHEST_CATEGORY';
  }

  for (const pattern of dayPatterns) {
    if (pattern.test(q)) return 'HIGHEST_DAY';
  }

  return 'UNSUPPORTED';
}

export function answerFinancialQuery(queryText, expenses = [], yearMonth = getCurrentYearMonthString()) {
  const intent = classifyQuestion(queryText);
  const summary = getCurrentMonthSummary(expenses, yearMonth);

  if (intent === 'HIGHEST_CATEGORY') {
    if (!summary.highestCategoryResult.hasData) {
      return {
        status: 'no_data',
        intent,
        question: queryText,
        directAnswer: 'Not enough recorded expense data for this month.',
        explanation: 'There are no recorded expenses for the current month yet. Add expenses to see your highest-spending category.',
        canVerify: false
      };
    }

    const { isTie, categories, amount, percentage } = summary.highestCategoryResult;
    const formattedAmount = formatCurrency(amount);

    if (isTie) {
      const catList = categories.join(' and ');
      return {
        status: 'success',
        intent,
        question: queryText,
        directAnswer: `Tied for highest spending: ${catList} (${formattedAmount} each)`,
        evidence: `${catList} tied with ${formattedAmount} recorded spending each (${percentage}% of this month's recorded expenses).`,
        canVerify: true,
        targetView: 'monthly-history'
      };
    } else {
      const topCat = categories[0];
      return {
        status: 'success',
        intent,
        question: queryText,
        directAnswer: `${topCat} was your highest-spending category this month (${formattedAmount})`,
        evidence: `${topCat} accounted for ${formattedAmount} (${percentage}%) of your total ${formatCurrency(summary.totalSpending)} recorded this month.`,
        canVerify: true,
        targetView: 'monthly-history'
      };
    }
  }

  if (intent === 'HIGHEST_DAY') {
    if (!summary.highestDayResult.hasData) {
      return {
        status: 'no_data',
        intent,
        question: queryText,
        directAnswer: 'Not enough recorded expense data for this month.',
        explanation: 'There are no recorded expenses for the current month yet. Add expenses to see your highest-spending day.',
        canVerify: false
      };
    }

    const { isTie, dates, amount } = summary.highestDayResult;
    const formattedAmount = formatCurrency(amount);

    if (isTie) {
      const dateList = dates.join(' and ');
      return {
        status: 'success',
        intent,
        question: queryText,
        directAnswer: `Tied for highest-spending day: ${dateList} (${formattedAmount} each)`,
        evidence: `On ${dateList}, you had equal highest recorded spending of ${formattedAmount}.`,
        canVerify: true,
        targetView: 'monthly-history'
      };
    } else {
      const topDay = dates[0];
      return {
        status: 'success',
        intent,
        question: queryText,
        directAnswer: `${topDay} was your highest-spending day this month (${formattedAmount})`,
        evidence: `On ${topDay}, you recorded ${formattedAmount} in total expenses.`,
        canVerify: true,
        targetView: 'monthly-history'
      };
    }
  }

  return {
    status: 'unsupported',
    intent: 'UNSUPPORTED',
    question: queryText,
    directAnswer: 'I can only answer specific, verifiable questions about this month’s recorded spending.',
    explanation: 'Financial Memory uses deterministic calculations rather than conversational AI. Try asking one of the supported questions below:',
    supportedQuestions: SUPPORTED_QUESTIONS,
    canVerify: false
  };
}
