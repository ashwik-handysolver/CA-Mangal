// Tiny event bus so any code can show a toast or ask for confirmation
// without wiring props. <FeedbackHost /> (in Layout) renders them.

export function notify(message, type = 'info') {
  window.dispatchEvent(new CustomEvent('app:toast', { detail: { message, type } }));
}

export function confirmAction({ title, message, confirmLabel = 'Confirm', destructive = false }) {
  return new Promise((resolve) => {
    window.dispatchEvent(new CustomEvent('app:confirm', { detail: { title, message, confirmLabel, destructive, resolve } }));
  });
}
