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
  let transition = null;
  let revision = 0;

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
    const changeRevision = ++revision;
    transition?.skipTransition();
    transition = null;
    root.classList.remove('theme-transition');
    if (!animate || reduced.matches || !document.startViewTransition || document.hidden || document.fullscreenElement || root.dataset.theme === current) {
      apply();
      return;
    }
    // Composite two viewport snapshots instead of repainting thousands of colors
    // on every frame. Media, focus, scroll and the live DOM remain in place.
    root.classList.add('theme-transition');
    try {
      const view = document.startViewTransition(() => {
        if (changeRevision === revision) apply();
      });
      transition = view;
      const finish = () => {
        if (transition !== view) return;
        transition = null;
        root.classList.remove('theme-transition');
      };
      // Skipping a snapshot on a second click is an expected cancellation.
      view.ready.catch(() => {});
      view.finished.then(finish, () => {
        if (changeRevision === revision) apply();
        finish();
      });
    } catch {
      root.classList.remove('theme-transition');
      apply();
    }
  }

  apply();
  document.addEventListener('DOMContentLoaded', apply, {once: true});
  document.addEventListener('click', event => {
    let button = event.target.closest('[data-theme-toggle]');
    // A captured root can be the hit target during the short snapshot fade.
    // Keep repeat clicks on the visible theme control responsive in that case.
    if (!button && transition && event.target === root && event.button === 0) {
      button = [...document.querySelectorAll('[data-theme-toggle]')].find(control => {
        const rect = control.getBoundingClientRect();
        return event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom;
      });
    }
    if (!button) return;
    preference = current === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem(key, preference); } catch {}
    change(preference);
  });
  system.addEventListener('change', () => { if (!preference) change(system.matches ? 'dark' : 'light'); });
  reduced.addEventListener('change', () => {
    if (!reduced.matches) return;
    ++revision;
    transition?.skipTransition();
    transition = null;
    root.classList.remove('theme-transition');
    apply();
  });
  window.addEventListener('storage', event => {
    if (event.key !== key && event.key !== null) return;
    preference = valid(event.newValue) ? event.newValue : null;
    change(preference || (system.matches ? 'dark' : 'light'), false);
  });
})();
