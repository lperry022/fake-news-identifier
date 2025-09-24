// navbar.js - inject navbar and toggle based on auth state (one-time init)
if (!window.__NAVBAR_INIT__) {
  window.__NAVBAR_INIT__ = true;

  document.addEventListener('DOMContentLoaded', async () => {
    const container = document.getElementById('navbar-container');
    if (!container) return;

    try {
      const res = await fetch('/frontend/partials/navbar.html');
      container.innerHTML = await res.text();
    } catch (e) {
      console.error('Failed to load navbar:', e);
      return;
    }

    // Init Materialize components
    if (window.M?.Sidenav) M.Sidenav.init(document.querySelectorAll('.sidenav'));

    function updateAuthUI() {
      const isLoggedIn = window.Auth?.isLoggedIn?.() ?? false;
      document.querySelectorAll('.auth-logged-in').forEach(el => el.style.display = isLoggedIn ? '' : 'none');
      document.querySelectorAll('.auth-logged-out').forEach(el => el.style.display = isLoggedIn ? 'none' : '');
      const name = localStorage.getItem('userName');
      document.querySelectorAll('.nav-user-name').forEach(el => { el.textContent = name || 'User'; });
    }

    // Logout wiring (one-time)
    document.querySelectorAll('#nav-logout, #m-nav-logout').forEach(link => {
      link.addEventListener('click', async (e) => {
        e.preventDefault();
        try {
          await fetch('/auth/logout', { method: 'POST', credentials: 'include' });
        } catch (_) {}
        window.Auth?.clear?.();
        try { M.toast({ html: 'Logged out', classes: 'blue darken-2' }); } catch(_) {}
        setTimeout(() => (window.location.href = '/frontend/index.html'), 400);
      }, { once: true });
    });

    updateAuthUI();
  });
}
