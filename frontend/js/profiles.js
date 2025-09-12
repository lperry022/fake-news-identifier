// ---------- helpers ----------
const $  = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));
const toast = (msg) => window.M && M.toast({ html: msg });

async function getJSON(url, opts = {}) {
  const res = await fetch(url, opts);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || res.statusText);
  return data;
}
async function postJSON(url, body) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body)
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || res.statusText);
  return data;
}
async function putJSON(url, body) {
  const res = await fetch(url, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body)
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || res.statusText);
  return data;
}
function pushEvent(text) {
  const ul = $("#rtList");
  if (!ul) return;
  if (ul.firstElementChild && ul.firstElementChild.textContent.includes("Waiting")) {
    ul.innerHTML = "";
  }
  const li = document.createElement("li");
  li.className = "collection-item";
  li.textContent = text;
  ul.prepend(li);
}

// ---------- main ----------
document.addEventListener("DOMContentLoaded", async () => {
  // init Materialize
  if (window.M) M.AutoInit();

  // 1) ensure logged in
  let me = null;
  try {
    const out = await getJSON("/auth/me", { credentials: "include" });
    me = out?.user || null;
  } catch {}
  if (!me) {
    toast("Please log in first");
    window.location.href = "/";   // send to home (your modal can open there)
    return;
  }

  // 2) load profile (name/email)
  try {
    // If you have /api/profile, prefer that; else /auth/me has enough
    const prof = await getJSON("/api/profile", { credentials: "include" }).catch(() => ({ user: me }));
    const user = prof?.user || me;
    $("#nameVal").textContent  = user.name || "—";
    $("#emailVal").textContent = user.email || "—";
    $("#newName").value = user.name || "";
    // keep label floated
    const label = document.querySelector('label[for="newName"]');
    label && label.classList.add("active");
  } catch (e) {
    toast("Failed to load profile");
  }

  // 3) save name
  $("#btn-save-name")?.addEventListener("click", async () => {
    const name = ($("#newName")?.value || "").trim();
    if (!name) return toast("Enter a name");
    try {
      const res = await putJSON("/api/profile", { name });
      $("#nameVal").textContent = res?.user?.name || name;
      toast("Profile updated");
      pushEvent("You updated your name");
    } catch (e) {
      toast(e.message || "Failed to update");
    }
  });

  // 4) logout
  $("#btn-logout")?.addEventListener("click", async () => {
    try { await postJSON("/auth/logout", {}); } catch {}
    window.location.href = "/";
  });

  // 5) socket.io (optional realtime)
  try {
    const socket = io({ withCredentials: true });
    socket.on("connect", () => pushEvent("Socket connected"));
    socket.on("disconnect", () => pushEvent("Socket disconnected"));

    // listen to a couple of likely event names
    socket.on("profile:update", (payload) => {
      if (payload?.name) {
        $("#nameVal").textContent = payload.name;
        $("#newName").value = payload.name;
      }
      pushEvent("Profile updated from another tab");
      toast("Profile updated on server");
    });
    socket.on("profile:updated", (payload) => {
      if (payload?.name) {
        $("#nameVal").textContent = payload.name;
        $("#newName").value = payload.name;
      }
      pushEvent("Profile updated (event)");
    });
  } catch {
    // sockets are optional; ignore if not configured
  }
});
