// Run before stylesheets so a saved theme is applied before the first paint.
(() => {
  const root = document.documentElement;
  const key = 'libero-theme';
  const system = matchMedia('(prefers-color-scheme: dark)');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const valid = value => value === 'light' || value === 'dark';
  let preference = null;
  try { const saved = localStorage.getItem(key); if (valid(saved)) preference = saved; } catch {}
  let current = preference || (system.matches ? 'dark' : 'light');
  let timer;

  function apply() {
    root.dataset.theme = current;
    root.style.colorScheme = current;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', current === 'dark' ? '#121619' : '#ffffff');
    document.querySelectorAll('[data-theme-toggle]').forEach(button => {
      const label = `Switch to ${current === 'dark' ? 'light' : 'dark'} theme`;
      button.setAttribute('aria-label', label);
      button.title = label;
    });
  }

  function change(next, animate = true) {
    if (next === current) return;
    current = next;
    clearTimeout(timer);
    if (!animate || reduced.matches) {
      root.classList.remove('theme-changing');
      apply();
      return;
    }
    root.classList.add('theme-changing');
    apply();
    timer = setTimeout(() => root.classList.remove('theme-changing'), 400);
  }

  apply();
  document.addEventListener('DOMContentLoaded', apply, {once: true});
  document.addEventListener('click', event => {
    if (!event.target.closest('[data-theme-toggle]')) return;
    preference = current === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem(key, preference); } catch {}
    change(preference);
  });
  system.addEventListener('change', () => { if (!preference) change(system.matches ? 'dark' : 'light'); });
  reduced.addEventListener('change', () => {
    if (!reduced.matches) return;
    clearTimeout(timer);
    root.classList.remove('theme-changing');
    apply();
  });
  window.addEventListener('storage', event => {
    if (event.key !== key && event.key !== null) return;
    preference = valid(event.newValue) ? event.newValue : null;
    change(preference || (system.matches ? 'dark' : 'light'), false);
  });
})();
