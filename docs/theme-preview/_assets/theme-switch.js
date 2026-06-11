/* CannaSaaS Theme Preview — theme switcher.
 *
 * Renders a fixed top-right dropdown on every preview page; selecting
 * a theme swaps the `<link id="tp-theme">` href to the chosen file in
 * packages/ui/src/themes/ and updates the html[data-theme] attribute
 * so theme rules scoped by attribute selector also take effect.
 */
(function () {
  const THEMES = [
    'apothecary',
    'casual',
    'citrus',
    'dark',
    'earthy',
    'midnight',
    'minimal',
    'modern',
    'neon',
    'regal',
  ];
  const STORAGE_KEY = 'cs.preview.theme';

  function themeHref(name, depth) {
    const up = '../'.repeat(depth);
    return `${up}_assets/themes/theme.${name}.css`;
  }

  function init() {
    const root = document.documentElement;
    const depth = Number(root.dataset.previewDepth ?? '1');
    const initial =
      localStorage.getItem(STORAGE_KEY) || root.dataset.theme || 'modern';

    let link = document.getElementById('tp-theme');
    if (!link) {
      link = document.createElement('link');
      link.id = 'tp-theme';
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }
    link.href = themeHref(initial, depth);
    root.dataset.theme = initial;

    const switcher = document.createElement('div');
    switcher.className = 'tp-switcher';
    switcher.innerHTML =
      '<label for="tp-select">Theme</label>' +
      '<select id="tp-select">' +
      THEMES.map(
        (t) =>
          `<option value="${t}"${t === initial ? ' selected' : ''}>${t}</option>`,
      ).join('') +
      '</select>';
    document.body.appendChild(switcher);

    const select = switcher.querySelector('select');
    select.addEventListener('change', (e) => {
      const next = e.target.value;
      link.href = themeHref(next, depth);
      root.dataset.theme = next;
      localStorage.setItem(STORAGE_KEY, next);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
