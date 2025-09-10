const API_BASE = "";

function toast(msg) { M.toast({ html: msg }); }

async function getJSON(url) {
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) throw new Error((await res.json()).error || res.statusText);
  return res.json();
}
async function putJSON(url, body) {
  const res = await fetch(url, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    credentials: "include"
  });
  if (!res.ok) throw new Error((await res.json()).error || res.statusText);
  return res.json();
}

async function loadProfile() {
  try {
    // quick auth check
    await getJSON(`${API_BASE}/auth/me`);

    const { profile } = await getJSON(`${API_BASE}/api/profile`);
    document.getElementById("p-name").textContent = profile.name;
    document.getElementById("p-email").textContent = profile.email;

    // connect socket (session-authenticated)
    const socket = io();
    const log = (m) => {
      const el = document.getElementById("rt-log");
      el.textContent = `[${new Date().toLocaleTimeString()}] ${m}`;
    };
    socket.on("welcome", (d) => log(`Socket connected as ${d.name}`));
    socket.on("profile:update", (d) => log(`Name updated to "${d.name}"`));
  } catch (e) {
    // not logged in
    location.href = "/index.html";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadProfile();

  document.getElementById("save-name").addEventListener("click", async () => {
    const newName = document.getElementById("p-newname").value.trim();
    if (!newName) return toast("Enter a name");
    try {
      const { profile } = await putJSON(`${API_BASE}/api/profile`, { name: newName });
      document.getElementById("p-name").textContent = profile.name;
      toast("Saved");
    } catch (e) { toast(e.message || "Update failed"); }
  });

  document.getElementById("logout-link").addEventListener("click", async () => {
    await fetch(`${API_BASE}/auth/logout`, { method: "POST", credentials: "include" });
    location.href = "/index.html";
  });
});
