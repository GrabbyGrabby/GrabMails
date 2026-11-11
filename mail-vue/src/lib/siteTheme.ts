export const SITE_THEME_EVENT = 'site-theme-change';

export function getSiteTheme(): 'dark' | 'light' {
  if (typeof document !== 'undefined') {
    if (document.documentElement.classList.contains('dark')) return 'dark';
    const saved = localStorage.getItem('theme');
    if (saved === 'dark' || saved === 'light') return saved;
  }
  return 'dark';
}

export function setSiteTheme(theme: 'dark' | 'light') {
  if (typeof document === 'undefined') return;
  const isDark = theme === 'dark';
  document.documentElement.classList.toggle('dark', isDark);
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
  window.dispatchEvent(new CustomEvent(SITE_THEME_EVENT, { detail: { theme } }));
}

export function toggleSiteTheme(): 'dark' | 'light' {
  const current = getSiteTheme();
  const next = current === 'dark' ? 'light' : 'dark';
  setSiteTheme(next);
  return next;
}
