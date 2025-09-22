// app.js — shared helpers (Auth, etc.)
window.Auth = (function () {
  const TOKEN_KEYS = ['userToken', 'authToken', 'token']; // accept any of these

  function getToken() {
    for (const k of TOKEN_KEYS) {
      const v = localStorage.getItem(k);
      if (v) return v;
    }
    // as a fallback, accept a cookie-based session if you use one
    const sid = document.cookie.split('; ').find(c => c.startsWith('sid=')); // adjust if needed
    return sid ? sid.split('=')[1] : null;
  }

  function isLoggedIn() {
    return !!getToken();
  }

  function setToken(value) {
    // write to the canonical key AND (for compatibility) to the older ones
    localStorage.setItem('userToken', value);
    localStorage.setItem('authToken', value);
    localStorage.setItem('token', value);
  }

  function clear() {
    ['userToken','authToken','token','userName'].forEach(k => localStorage.removeItem(k));
  }

  function requireLogin(opts = {}) {
    if (isLoggedIn()) return true;
    const redirectTo = encodeURIComponent(opts.redirect || window.location.pathname + window.location.search);
    try { M && M.toast({html:'You must log in to access this page', classes:'red darken-2'}); } catch(_) {}
    window.location.replace(`/frontend/login.html?redirect=${redirectTo}`);
    return false;
  }

  function completeLoginAndRedirect(defaultDest = '/frontend/dashboard.html') {
    const params = new URLSearchParams(window.location.search);
    const dest = params.get('redirect') || defaultDest;
    window.location.replace(dest);
  }

  return { getToken, isLoggedIn, setToken, clear, requireLogin, completeLoginAndRedirect };
})();
