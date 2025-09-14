// ---------- tiny helpers ----------
const $  = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));
const toast = (msg) => window.M && M.toast({ html: msg });

function show(el, v = true){ if(el) el.style.display = v ? "" : "none"; }
function toggleAuthUI(isLoggedIn){
  $$(".auth-logged-in").forEach(el => show(el,  isLoggedIn));
  $$(".auth-logged-out").forEach(el => show(el, !isLoggedIn));
}

async function getJSON(url, opts={}){
  const r = await fetch(url, opts);
  const j = await r.json().catch(() => ({}));
  if(!r.ok) throw new Error(j?.error || r.statusText);
  return j;
}
async function postJSON(url, body, creds=true){
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type":"application/json" },
    credentials: creds ? "include" : "same-origin",
    body: JSON.stringify(body)
  });
  const j = await r.json().catch(() => ({}));
  if(!r.ok) throw new Error(j?.error || r.statusText);
  return j;
}
async function putJSON(url, body){
  const r = await fetch(url, {
    method: "PUT",
    headers: { "Content-Type":"application/json" },
    credentials: "include",
    body: JSON.stringify(body)
  });
  const j = await r.json().catch(() => ({}));
  if(!r.ok) throw new Error(j?.error || r.statusText);
  return j;
}

// ---------- auth ----------
async function fetchMe(){
  try{
    const r = await fetch("/auth/me", { credentials:"include" });
    if(!r.ok) return null;
    const j = await r.json();
    return j?.user || null;
  }catch{ return null; }
}

async function doRegister(){
  const name = $("#reg-name")?.value?.trim();
  const email = $("#reg-email")?.value?.trim();
  const password = $("#reg-password")?.value || "";
  if(!name || !email || !password) return toast("Please fill all fields");
  try{
    const out = await postJSON("/auth/register", { name,email,password }, true);
    if(out?.ok){
      toast("Account created — logged in");
      toggleAuthUI(true);
      location.href = "/frontend/profile.html";
    }
  }catch(e){ toast(e.message || "Registration failed"); }
}

async function doLogin(){
  const email = $("#login-email")?.value?.trim();
  const password = $("#login-password")?.value || "";
  if(!email || !password) return toast("Enter email & password");
  try{
    const out = await postJSON("/auth/login", { email,password }, true);
    if(out?.ok){
      toast("Logged in");
      toggleAuthUI(true);
      location.href = "/frontend/profile.html";
    }
  }catch(e){ toast(e.message || "Login failed"); }
}

async function doLogout(){
  try{ await postJSON("/auth/logout", {}, true); }catch{}
  toggleAuthUI(false);
  location.href = "/frontend/index.html";
}

// ---------- analyzer (home) ----------
async function analyzeInput(){
  const input = $("#newsInput")?.value?.trim();
  if(!input) return toast("Paste a headline or URL first");
  show($("#loader"), true);
  show($("#result"), false);
  try{
    const data = await postJSON("/api/analyze", { input }, false);
    renderResult(data);
    show($("#result"), true);
  }catch(e){ toast(e.message || "Analysis failed"); }
  finally{ show($("#loader"), false); }
}

const verdictColors = {
  "Likely Credible": "green",
  "Needs Verification": "orange",
  "Likely Fake / Misleading": "red"
};
const sourceColors = { "Trusted":"green", "Unknown":"grey", "Untrusted":"red" };

function setChip(el, text, colorMap){
  if(!el) return;
  el.className = "chip";
  el.classList.add(colorMap[text] || "grey");
  el.textContent = text;
}
function renderResult({ verdict, score, sourceLabel, flags }){
  setChip($("#verdictBadge"), verdict, verdictColors);
  const pct = Math.max(0, Math.min(100, Number(score)||0));
  $("#scoreBar").style.width = `${pct}%`;
  $("#scoreText").textContent = `${pct}/100 (higher = more credible)`;
  setChip($("#sourceBadge"), sourceLabel || "Unknown", sourceColors);
  const list = $("#flagsList");
  if(!list) return;
  list.innerHTML = "";
  (flags && flags.length ? flags : ["No flags detected."]).forEach(f=>{
    const li = document.createElement("li");
    li.className = "collection-item"; li.textContent = f;
    list.appendChild(li);
  });
}

// ---------- init ----------
document.addEventListener("DOMContentLoaded", async () => {
  if(window.M){
    M.Sidenav.init($$(".sidenav"));
    M.updateTextFields?.();
  }

  // auth state in nav (every page)
  const me = await fetchMe();
  toggleAuthUI(!!me);

  // logout (if present)
  $("#nav-logout")?.addEventListener("click", (e)=>{ e.preventDefault(); doLogout(); });
  $("#m-nav-logout")?.addEventListener("click", (e)=>{ e.preventDefault(); doLogout(); });

  // home analyzer
  $("#analyzeBtn")?.addEventListener("click", analyzeInput);
  $("#newsInput")?.addEventListener("keydown", (e)=>{ if(e.key==="Enter") analyzeInput(); });

  // register page
  if($("#btn-register")){
    $("#registerForm")?.addEventListener("submit", (e)=>{ e.preventDefault(); doRegister(); });
    $("#btn-register")?.addEventListener("click", (e)=>{ e.preventDefault(); doRegister(); });
  }

  // login page
  if($("#loginForm")){
    $("#loginForm")?.addEventListener("submit", (e)=>{ e.preventDefault(); doLogin(); });
    // show/hide password
    $("#togglePwd")?.addEventListener("click", ()=>{
      const p = $("#login-password");
      const show = p.type === "password";
      p.type = show ? "text" : "password";
      $("#togglePwd i").textContent = show ? "visibility_off" : "visibility";
      p.focus();
    });
  }

  // profile page
  if($("#profilePage")){
    // load
    try{
      let r = await fetch("/api/profile", { credentials:"include" });
      let j = await r.json().catch(()=>({}));
      if(!r.ok || !j?.user){
        // try /auth/me as fallback
        r = await fetch("/auth/me", { credentials:"include" });
        j = await r.json().catch(()=>({}));
      }
      if(!j?.user){ location.href = "/frontend/login.html"; return; }
      const u = j.user;
      $("#nameText").textContent  = u.name  || "—";
      $("#emailText").textContent = u.email || "—";
      $("#idText").textContent    = u.id || u._id || "—";
      $("#newName").value = u.name || "";
      M.updateTextFields?.();
    }catch{ /* ignore */ }

    // save
    $("#saveNameBtn")?.addEventListener("click", async ()=>{
      const name = ($("#newName")?.value || "").trim();
      if(!name) return toast("Enter a name");
      try{
        const out = await putJSON("/api/profile", { name });
        $("#nameText").textContent = out?.user?.name || name;
        toast("Name updated");
      }catch(e){ toast(e.message || "Failed to update"); }
    });
  }
});
