// Keyboard shortcuts helper for Financial Memory
// Provides fast modal access:
//   'E' or 'e': Open Add Expense modal
//   'S' or 's': Open Add Saving contribution modal
//   'Escape': Close active modals
// Ignores keypresses when typing in input, textarea, select, contentEditable, or when modifiers are held.

export function isEditableElement(element) {
  if (!element) return false;
  const tagName = element.tagName ? element.tagName.toUpperCase() : '';
  if (tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT') {
    return true;
  }
  if (element.isContentEditable) {
    return true;
  }
  return false;
}

export function shouldTriggerShortcut(event) {
  if (!event) return false;
  // Ignore if user is holding Ctrl, Alt, Meta/Command, etc.
  if (event.ctrlKey || event.altKey || event.metaKey) {
    return false;
  }
  // Ignore if focus is in an input, textarea, select, or editable element
  if (isEditableElement(event.target)) {
    return false;
  }
  return true;
}

export function handleKeyboardShortcut(event, actions = {}) {
  if (!event) return false;

  const key = event.key;

  // Escape always closes open modals even if focus is inside modal inputs (unless handled by default input escape)
  if (key === 'Escape') {
    if (typeof actions.closeModals === 'function') {
      const handled = actions.closeModals();
      if (handled) {
        event.preventDefault();
        return true;
      }
    }
    return false;
  }

  // Check if we should process single-key shortcuts
  if (!shouldTriggerShortcut(event)) {
    return false;
  }

  // Check if any modal is currently active/open
  if (typeof actions.isAnyModalOpen === 'function' && actions.isAnyModalOpen()) {
    // If a modal is already open, do not open another modal over it
    return false;
  }

  const lowerKey = key.toLowerCase();

  if (lowerKey === 'e') {
    if (typeof actions.openExpense === 'function') {
      event.preventDefault();
      actions.openExpense();
      return true;
    }
  }

  if (lowerKey === 's') {
    if (typeof actions.openSaving === 'function') {
      event.preventDefault();
      actions.openSaving();
      return true;
    }
  }

  return false;
}

export function setupKeyboardShortcuts({ openExpense, openSaving, closeModals, isAnyModalOpen }) {
  const listener = (event) => {
    handleKeyboardShortcut(event, {
      openExpense,
      openSaving,
      closeModals,
      isAnyModalOpen
    });
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('keydown', listener);
  }

  return () => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('keydown', listener);
    }
  };
}
