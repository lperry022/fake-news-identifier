// profile.js – fetch & render current user; allow renaming
console.log("PROFILE.JS LOADED v2");

document.addEventListener('DOMContentLoaded', async () => {
  await loadProfile();

  const form = document.getElementById('nameForm');
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('new-name')?.value?.trim();
    if (!name) {
      try { M.toast({ html: 'Please enter a name', classes: 'red darken-2' }); } catch (_){}
      return;
    }
    try {
      // prefer /user/name if present, otherwise you can add a /auth/name route similarly
      const res = await fetch('/user/name', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || res.statusText);

      document.getElementById('profile-name').textContent = data.user.name;
      localStorage.setItem('userName', data.user.name);
      try { M.toast({ html: 'Name updated', classes: 'green darken-2' }); } catch (_){}
    } catch (err) {
      console.error(err);
      try { M.toast({ html: err.message || 'Update failed', classes: 'red darken-2' }); } catch (_){}
    }
  });
});

async function loadProfile() {
  const fill = (u) => {
    document.getElementById('profile-name').textContent = u.name || '—';
    document.getElementById('profile-email').textContent = u.email || '—';
    document.getElementById('profile-id').textContent = u.id || u._id || '—';
    if (u.name) localStorage.setItem('userName', u.name);
  };

  // try /user/me first, then /auth/me for compatibility
  const tryEndpoints = ['/user/me', '/auth/me'];
  for (const url of tryEndpoints) {
    try {
      const res = await fetch(url, { credentials: 'include' });
      if (res.status === 401) continue;              // not authed here → try next
      if (!res.ok) continue;
      const data = await res.json().catch(() => ({}));
      if (data?.user) { fill(data.user); return; }
    } catch (_) { /* continue */ }
  }

  // if we reach here, we’re not authenticated or route missing
  console.warn('No /user(me) data; redirecting to login');
  try { M.toast({ html: 'Please log in again', classes: 'red darken-2' }); } catch (_){}
  setTimeout(() => (window.location.href = '/frontend/login.html?redirect=profile.html'), 800);
}
