document.addEventListener('DOMContentLoaded', async () => {
  const container = document.getElementById('navbar-container');
  if (!container) return;
  try {
    const res = await fetch('/frontend/partials/navbar.html');
    container.innerHTML = await res.text();
    // re-init Materialize sidenav after injection
    if (window.M?.Sidenav) M.Sidenav.init(document.querySelectorAll('.sidenav'));
    if (window.Auth) Auth.applyNavState();
  } catch (err) {
    console.error('Failed to load navbar:', err);
  }
});
