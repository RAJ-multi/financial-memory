import test from 'node:test';
import assert from 'node:assert/strict';
import { classifyQuestion, answerFinancialQuery } from '../src/query-engine.js';

test('classifyQuestion identifies category, day, and unsupported intents', () => {
  assert.equal(classifyQuestion('Which category has the highest spending this month?'), 'HIGHEST_CATEGORY');
  assert.equal(classifyQuestion('Where did most of my money go this month?'), 'HIGHEST_CATEGORY');
  assert.equal(classifyQuestion('top category'), 'HIGHEST_CATEGORY');

  assert.equal(classifyQuestion('Which day had the highest spending this month?'), 'HIGHEST_DAY');
  assert.equal(classifyQuestion('Which day did I spend the most?'), 'HIGHEST_DAY');
  assert.equal(classifyQuestion('highest spending day this month'), 'HIGHEST_DAY');

  assert.equal(classifyQuestion('How can I invest my money?'), 'UNSUPPORTED');
  assert.equal(classifyQuestion('What will inflation be next year?'), 'UNSUPPORTED');
  assert.equal(classifyQuestion('Hello how are you?'), 'UNSUPPORTED');
});

test('answerFinancialQuery returns honest no_data state when no current month expenses exist', () => {
  const resCat = answerFinancialQuery('Which category has the highest spending this month?', [], '2026-10');
  assert.equal(resCat.status, 'no_data');
  assert.equal(resCat.canVerify, false);

  const resDay = answerFinancialQuery('Which day had the highest spending this month?', [], '2026-10');
  assert.equal(resDay.status, 'no_data');
  assert.equal(resDay.canVerify, false);
});

test('answerFinancialQuery provides deterministic category answer with evidence', () => {
  const expenses = [
    { amount: 50.00, category: 'Food & Drinks', date: '2026-10-02' },
    { amount: 20.00, category: 'Transport', date: '2026-10-03' }
  ];
  const res = answerFinancialQuery('Which category has the highest spending this month?', expenses, '2026-10');
  assert.equal(res.status, 'success');
  assert.equal(res.intent, 'HIGHEST_CATEGORY');
  assert.match(res.directAnswer, /Food & Drinks/);
  assert.match(res.directAnswer, /\$50\.00/);
  assert.equal(res.canVerify, true);
  assert.equal(res.targetView, 'monthly-history');
});

test('answerFinancialQuery handles category ties honestly', () => {
  const expenses = [
    { amount: 30.00, category: 'Food & Drinks', date: '2026-10-02' },
    { amount: 30.00, category: 'Education', date: '2026-10-03' }
  ];
  const res = answerFinancialQuery('highest category', expenses, '2026-10');
  assert.equal(res.status, 'success');
  assert.match(res.directAnswer, /Tied/);
  assert.match(res.directAnswer, /Food & Drinks/);
  assert.match(res.directAnswer, /Education/);
});

test('answerFinancialQuery provides deterministic day answer with evidence', () => {
  const expenses = [
    { amount: 15.00, category: 'Food & Drinks', date: '2026-10-02' },
    { amount: 65.00, category: 'Shopping', date: '2026-10-07' },
    { amount: 10.00, category: 'Transport', date: '2026-10-07' }
  ];
  const res = answerFinancialQuery('Which day had the highest spending this month?', expenses, '2026-10');
  assert.equal(res.status, 'success');
  assert.equal(res.intent, 'HIGHEST_DAY');
  assert.match(res.directAnswer, /2026-10-07/);
  assert.match(res.directAnswer, /\$75\.00/);
  assert.equal(res.canVerify, true);
});

test('answerFinancialQuery provides honest guidance for unsupported queries', () => {
  const res = answerFinancialQuery('Give me tax advice', [], '2026-10');
  assert.equal(res.status, 'unsupported');
  assert.equal(res.intent, 'UNSUPPORTED');
  assert.equal(res.canVerify, false);
  assert.equal(res.supportedQuestions.length, 2);
});
