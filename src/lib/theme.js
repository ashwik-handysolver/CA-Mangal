export const isDark = () => document.documentElement.classList.contains('dark');

export function toggleTheme() {
  const next = !isDark();
  document.documentElement.classList.toggle('dark', next);
  localStorage.theme = next ? 'dark' : 'light';
  return next;
}

export function currentEmail() {
  try {
    return JSON.parse(localStorage.getItem('currentUser') || '{}').email || '';
  } catch {
    return '';
  }
}
