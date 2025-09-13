function toast(html){ M.toast({ html }); }

document.addEventListener("DOMContentLoaded", () => {
  fetch("/auth/me", { credentials: "include" }).then(r => {
    if (r.ok) location.href = "/profile.html";
  });

  const form = document.getElementById("loginForm");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("login-email").value.trim();
    const password = document.getElementById("login-password").value;
    try {
      const res = await fetch("/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password })
      });
      if (!res.ok) throw new Error((await res.json()).error || "Login failed");
      toast("Welcome back!");
      location.href = "/profile.html";
    } catch (err) {
      toast(err.message);
    }
  });
});
