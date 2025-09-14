// =================== tiny helpers ===================
const $  = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));
const toast = (msg) => window.M && M.toast({ html: msg });

function toggle(el, show = true) { if (el) el.style.display = show ? "" : "none"; }
function toggleAuthUI(isLoggedIn) {
  $$(".auth-logged-in").forEach(el => toggle(el,  isLoggedIn));
  $$(".auth-logged-out").forEach(el => toggle(el, !isLoggedIn));
}

async function getJSON(url, opts = {}) {
  const res = await fetch(url, opts);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || res.statusText);
  return data;
}
async function postJSON(url, body, withCreds = false) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: withCreds ? "include" : "same-origin",
    body: JSON.stringify(body)
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || res.statusText);
  return data;
}

// =================== auth (API calls kept for pages that need them) ===================
async function fetchMe() {
  try {
    const res = await fetch("/auth/me", { credentials: "include" });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.user || null;
  } catch { return null; }
}
async function doRegister() {
  const name = $("#reg-name")?.value?.trim();
  const email = $("#reg-email")?.value?.trim();
  const password = $("#reg-password")?.value || "";
  if (!name || !email || !password) return toast("Please fill all fields");

  try {
    const out = await postJSON("/auth/register", { name, email, password }, true);
    if (out?.ok) {
      toast("Account created — logged in");
      toggleAuthUI(true);
      window.location.href = "/"; // go home after success
    } else toast(out?.error || "Registration failed");
  } catch (e) { toast(e.message || "Registration failed"); }
}
async function doLogin() {
  const email = $("#login-email")?.value?.trim();
  const password = $("#login-password")?.value || "";
  if (!email || !password) return toast("Enter email & password");

  try {
    const out = await postJSON("/auth/login", { email, password }, true);
    if (out?.ok) {
      toast("Logged in");
      toggleAuthUI(true);
      window.location.href = "/"; // go home after success
    } else toast(out?.error || "Invalid credentials");
  } catch (e) { toast(e.message || "Login failed"); }
}
async function doLogout() {
  try { await postJSON("/auth/logout", {}, true); } catch {}
  toggleAuthUI(false);
  toast("Logged out");
  window.location.href = "/";
}

// =================== analyzer UI ===================
const verdictColors = {
  "Likely Credible": "green",
  "Needs Verification": "orange",
  "Likely Fake / Misleading": "red"
};
const sourceColors = { "Trusted": "green", "Unknown": "grey", "Untrusted": "red" };

function setChip(el, text, colorMap) {
  if (!el) return;
  el.className = "chip";
  el.classList.add(colorMap[text] || "grey");
  el.textContent = text;
}
function renderResult({ verdict, score, sourceLabel, flags }) {
  setChip($("#verdictBadge"), verdict, verdictColors);

  const pct = Math.max(0, Math.min(100, Number(score) || 0));
  $("#scoreBar").style.width = `${pct}%`;
  $("#scoreText").textContent = `${pct}/100 (higher = more credible)`;

  setChip($("#sourceBadge"), sourceLabel || "Unknown", sourceColors);

  const list = $("#flagsList");
  list.innerHTML = "";
  if (flags && flags.length) {
    flags.forEach(f => {
      const li = document.createElement("li");
      li.className = "collection-item";
      li.textContent = f;
      list.appendChild(li);
    });
  } else {
    const li = document.createElement("li");
    li.className = "collection-item";
    li.textContent = "No flags detected.";
    list.appendChild(li);
  }
}
async function analyzeInput() {
  const input = $("#newsInput")?.value?.trim();
  if (!input) return toast("Please paste a headline or URL first.");

  toggle($("#loader"), true);
  toggle($("#result"), false);
  try {
    const data = await postJSON("/api/analyze", { input });
    renderResult(data);
    toggle($("#result"), true);
  } catch (e) { toast(e.message || "Analysis failed"); }
  finally { toggle($("#loader"), false); }
}

// =================== health (optional) ===================
async function pingHealth() {
  try {
    const h = await getJSON("/api/health");
    if (!h?.ok) console.warn("Health check not OK:", h);
  } catch (e) { console.warn("Health check failed:", e?.message || e); }
}

// =================== navigation wiring ===================
function wireAuthNavLinks() {
  // your files are /index.html, /login.html, /register.html (same folder)
  const map = [
    ["#nav-register",   "/register.html"],
    ["#m-nav-register", "/register.html"],
    ["#nav-login",      "/login.html"],
    ["#m-nav-login",    "/login.html"]
  ];
  map.forEach(([sel, href]) => {
    const el = document.querySelector(sel);
    if (!el) return;
    el.setAttribute("href", href); // ensure correct href
    // force navigation even if any other handler is attached
    el.addEventListener("click", (e) => {
      if (!el.getAttribute("href") || el.getAttribute("href").startsWith("#")) e.preventDefault();
      window.location.href = href;
    });
  });
}

// =================== init ===================
document.addEventListener("DOMContentLoaded", async () => {
  if (window.M) {
    M.Sidenav.init($$(".sidenav"));
    // no modal init; we use real pages
  }

  wireAuthNavLinks();

  const me = await fetchMe();
  toggleAuthUI(!!me);

  // Buttons on respective pages (only exist there)
  $("#btn-register")?.addEventListener("click", doRegister);
  $("#btn-login")?.addEventListener("click", doLogin);
  $("#nav-logout")?.addEventListener("click", doLogout);
  $("#m-nav-logout")?.addEventListener("click", doLogout);

  // Analyzer
  $("#analyzeBtn")?.addEventListener("click", analyzeInput);
  $("#newsInput")?.addEventListener("keydown", (e) => { if (e.key === "Enter") analyzeInput(); });

  pingHealth();
});

// =================== (optional) socket.io ===================
// const socket = io({ withCredentials: true });
// socket.on("connect", () => console.log("socket connected"));
