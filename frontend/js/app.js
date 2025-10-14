// app.js — shared helpers (Auth, etc.)
window.Auth = (function () {
  const TOKEN_KEYS = ['userToken', 'authToken', 'token']; // accept any of these

  function getToken() {
    for (const k of TOKEN_KEYS) {
      const v = localStorage.getItem(k);
      if (v) return v;
    }
    // fallback: cookie-based session (if any)
    const sid = document.cookie.split('; ').find(c => c.startsWith('sid='));
    return sid ? sid.split('=')[1] : null;
  }

  function isLoggedIn() {
    return !!getToken();
  }

  function setToken(value) {
    // write to all known keys (for compatibility)
    localStorage.setItem('userToken', value);
    localStorage.setItem('authToken', value);
    localStorage.setItem('token', value);
  }

  function clear() {
    ['userToken', 'authToken', 'token', 'userName'].forEach(k =>
      localStorage.removeItem(k)
    );
  }

  function requireLogin(opts = {}) {
    if (isLoggedIn()) return true;
    const redirectTo = encodeURIComponent(
      opts.redirect || window.location.pathname + window.location.search
    );
    try {
      if (window.M && M.toast) {
        M.toast({
          html: 'You must log in to access this page',
          classes: 'red darken-2',
        });
      }
    } catch (_) {}
    window.location.replace(`/frontend/login.html?redirect=${redirectTo}`);
    return false;
  }

  function completeLoginAndRedirect(defaultDest = '/frontend/dashboard.html') {
    const params = new URLSearchParams(window.location.search);
    const dest = params.get('redirect') || defaultDest;
    window.location.replace(dest);
  }

  return {
    getToken,
    isLoggedIn,
    setToken,
    clear,
    requireLogin,
    completeLoginAndRedirect,
  };
})();

/* ============================================================
   Keyword Highlighting Feature (Home Page Only)
   ============================================================ */
window.KeywordHighlighter = (function () {
  const keywords = ['fake', 'news', 'alert', 'true', 'breaking', 'fact'];

  function highlightText(node) {
    const text = node.textContent;
    const regex = new RegExp(`\\b(${keywords.join('|')})\\b`, 'gi');
    if (!regex.test(text)) return;

    const span = document.createElement('span');
    span.innerHTML = text.replace(regex, '<span class="highlight">$1</span>');
    node.replaceWith(span);
  }

  function walkDOM(node) {
    if (node.nodeType === 3) {
      highlightText(node);
    } else {
      for (let child of node.childNodes) walkDOM(child);
    }
  }

  function apply(containerSelector = 'body') {
    const container = document.querySelector(containerSelector);
    if (container) walkDOM(container);
  }

  return { apply };
})();

// Automatically run keyword highlighting only on homepage
document.addEventListener('DOMContentLoaded', function () {
  const path = window.location.pathname;
  if (
    path.endsWith('index.html') ||
    path === '/' ||
    path === '/frontend/' ||
    path === '/frontend/index.html'
  ) {
    // Adjust container selector if your layout differs
    window.KeywordHighlighter.apply('.main-wrap');
  }
});
