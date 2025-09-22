// navbar.js - inject navbar and toggle based on auth state
document.addEventListener('DOMContentLoaded', async () => {
  const container = document.getElementById('navbar-container');
  if (!container) return;

  // ✅ correct path to your partials folder
  try {
    const res = await fetch('/frontend/partials/navbar.html');
    container.innerHTML = await res.text();
  } catch (e) {
    console.error('Failed to load navbar:', e);
    return; // bail if nav couldn't load
  }

  // init Materialize sidenav
  M.Sidenav.init(document.querySelectorAll('.sidenav'));

  updateAuthUI();

  // logout handlers
  document.querySelectorAll('#nav-logout, #m-nav-logout').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      localStorage.removeItem('userToken');
      localStorage.removeItem('userName');
      M.toast({ html: 'Logged out', classes: 'blue darken-2' });
      setTimeout(() => (window.location.href = '/frontend/index.html'), 600);
    });
  });
});

function updateAuthUI() {
  const isLoggedIn = Boolean(localStorage.getItem('userToken'));

  // ✅ only use the auth classes; do NOT hide by href
  document.querySelectorAll('.auth-logged-in').forEach(el => {
    el.style.display = isLoggedIn ? '' : 'none';
  });
  document.querySelectorAll('.auth-logged-out').forEach(el => {
    el.style.display = isLoggedIn ? 'none' : '';
  });
}
