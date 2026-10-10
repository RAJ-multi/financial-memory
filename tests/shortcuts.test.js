import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isEditableElement,
  shouldTriggerShortcut,
  handleKeyboardShortcut
} from '../src/shortcuts.js';

test('isEditableElement correctly identifies form inputs and editable elements', () => {
  assert.equal(isEditableElement(null), false);
  assert.equal(isEditableElement({ tagName: 'DIV' }), false);
  assert.equal(isEditableElement({ tagName: 'BUTTON' }), false);

  assert.equal(isEditableElement({ tagName: 'INPUT' }), true);
  assert.equal(isEditableElement({ tagName: 'input' }), true);
  assert.equal(isEditableElement({ tagName: 'TEXTAREA' }), true);
  assert.equal(isEditableElement({ tagName: 'SELECT' }), true);
  assert.equal(isEditableElement({ tagName: 'DIV', isContentEditable: true }), true);
});

test('shouldTriggerShortcut ignores shortcuts when modifier keys are held', () => {
  const normalEvent = { key: 'e', ctrlKey: false, altKey: false, metaKey: false, target: { tagName: 'BODY' } };
  assert.equal(shouldTriggerShortcut(normalEvent), true);

  assert.equal(shouldTriggerShortcut({ ...normalEvent, ctrlKey: true }), false);
  assert.equal(shouldTriggerShortcut({ ...normalEvent, altKey: true }), false);
  assert.equal(shouldTriggerShortcut({ ...normalEvent, metaKey: true }), false);
});

test('shouldTriggerShortcut ignores shortcuts when user is typing in form inputs', () => {
  const inputEvent = {
    key: 'e',
    ctrlKey: false,
    altKey: false,
    metaKey: false,
    target: { tagName: 'INPUT' }
  };
  assert.equal(shouldTriggerShortcut(inputEvent), false);

  const textareaEvent = {
    key: 's',
    ctrlKey: false,
    altKey: false,
    metaKey: false,
    target: { tagName: 'TEXTAREA' }
  };
  assert.equal(shouldTriggerShortcut(textareaEvent), false);
});

test('handleKeyboardShortcut triggers openExpense on "e" or "E"', () => {
  let openedExpense = false;
  let defaultPrevented = false;

  const actions = {
    openExpense: () => { openedExpense = true; },
    openSaving: () => {},
    closeModals: () => false,
    isAnyModalOpen: () => false
  };

  const eventLower = {
    key: 'e',
    ctrlKey: false,
    altKey: false,
    metaKey: false,
    target: { tagName: 'BODY' },
    preventDefault: () => { defaultPrevented = true; }
  };

  const handled = handleKeyboardShortcut(eventLower, actions);
  assert.equal(handled, true);
  assert.equal(openedExpense, true);
  assert.equal(defaultPrevented, true);

  // Test uppercase 'E'
  openedExpense = false;
  defaultPrevented = false;
  const eventUpper = {
    ...eventLower,
    key: 'E'
  };
  assert.equal(handleKeyboardShortcut(eventUpper, actions), true);
  assert.equal(openedExpense, true);
  assert.equal(defaultPrevented, true);
});

test('handleKeyboardShortcut triggers openSaving on "s" or "S"', () => {
  let openedSaving = false;
  let defaultPrevented = false;

  const actions = {
    openExpense: () => {},
    openSaving: () => { openedSaving = true; },
    closeModals: () => false,
    isAnyModalOpen: () => false
  };

  const event = {
    key: 's',
    ctrlKey: false,
    altKey: false,
    metaKey: false,
    target: { tagName: 'DIV' },
    preventDefault: () => { defaultPrevented = true; }
  };

  const handled = handleKeyboardShortcut(event, actions);
  assert.equal(handled, true);
  assert.equal(openedSaving, true);
  assert.equal(defaultPrevented, true);

  // Test uppercase 'S'
  openedSaving = false;
  assert.equal(handleKeyboardShortcut({ ...event, key: 'S' }, actions), true);
  assert.equal(openedSaving, true);
});

test('handleKeyboardShortcut does not open modals when a modal is already open', () => {
  let openedExpense = false;
  let openedSaving = false;

  const actions = {
    openExpense: () => { openedExpense = true; },
    openSaving: () => { openedSaving = true; },
    closeModals: () => false,
    isAnyModalOpen: () => true // A modal is already active
  };

  const event = {
    key: 'e',
    ctrlKey: false,
    altKey: false,
    metaKey: false,
    target: { tagName: 'BODY' },
    preventDefault: () => {}
  };

  const handled = handleKeyboardShortcut(event, actions);
  assert.equal(handled, false);
  assert.equal(openedExpense, false);
  assert.equal(openedSaving, false);
});

test('handleKeyboardShortcut closes open modals on Escape key', () => {
  let closedModals = false;
  let defaultPrevented = false;

  const actions = {
    openExpense: () => {},
    openSaving: () => {},
    closeModals: () => {
      closedModals = true;
      return true;
    },
    isAnyModalOpen: () => true
  };

  const event = {
    key: 'Escape',
    ctrlKey: false,
    altKey: false,
    metaKey: false,
    target: { tagName: 'INPUT' },
    preventDefault: () => { defaultPrevented = true; }
  };

  const handled = handleKeyboardShortcut(event, actions);
  assert.equal(handled, true);
  assert.equal(closedModals, true);
  assert.equal(defaultPrevented, true);
});

test('handleKeyboardShortcut ignores unrelated keys', () => {
  const actions = {
    openExpense: () => {},
    openSaving: () => {},
    closeModals: () => false,
    isAnyModalOpen: () => false
  };

  const event = {
    key: 'x',
    ctrlKey: false,
    altKey: false,
    metaKey: false,
    target: { tagName: 'BODY' },
    preventDefault: () => {}
  };

  assert.equal(handleKeyboardShortcut(event, actions), false);
});
