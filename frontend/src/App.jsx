import { useState } from "react";

export default function App() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  async function onSubmit(e) {
    e.preventDefault();
    setError(""); setResult(null); setLoading(true);
    try {
      const body = query.trim().startsWith("http") ? { url: query.trim() } : { title: query.trim() };
      const r = await fetch(`${import.meta.env.VITE_API_BASE}/api/analyze`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body)
      });
      if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || `Request failed (${r.status})`);
      setResult(await r.json());
    } catch (e) { setError(e.message); } finally { setLoading(false); }
  }

  return (
    <div>
      <TopNav />

      <main className="container-page pb-24">
        <Hero />

        {/* Search bar card */}
        <section className="mx-auto mt-8 max-w-2xl card p-4">
          <form onSubmit={onSubmit} className="flex gap-3">
            <label htmlFor="q" className="sr-only">Headline or URL</label>
            <input id="q" className="input" required minLength={3}
                   value={query} onChange={e=>setQuery(e.target.value)}
                   placeholder="Paste a headline or URL…" />
            <button type="submit" disabled={loading} className="btn-primary" aria-busy={loading}>
              {loading ? "Checking…" : "Check"}
            </button>
          </form>
          {error && (
            <p className="mt-3 rounded-xl bg-red-500/10 p-3 text-red-300 ring-1 ring-red-500/30" role="alert">{error}</p>
          )}
        </section>

        {/* Results */}
        {result && <ResultPanel result={result} />}

        {/* Stats like HIBP counters */}
        <section className="mx-auto mt-14 grid max-w-6xl grid-cols-1 gap-6 md:grid-cols-2">
          <div className="tile">
            <div className="text-4xl font-bold tabular-nums">903</div>
            <div className="mt-1 text-xs uppercase tracking-wide text-slate-400">pwned websites (demo)</div>
          </div>
          <div className="tile">
            <div className="text-4xl font-bold tabular-nums">15,098,981,649</div>
            <div className="mt-1 text-xs uppercase tracking-wide text-slate-400">pwned accounts (demo)</div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

function TopNav() {
  return (
    <header className="sticky top-0 z-10 border-b border-slate-800/60 bg-slate-950/70 backdrop-blur">
      <div className="container-page flex items-center justify-between py-3">
        <a href="#" className="inline-flex items-center gap-2">
          <Logo /> <span className="text-lg font-semibold tracking-tight">Fake News Identifier</span>
        </a>
        <nav className="hidden md:flex gap-6 text-sm text-slate-300">
          <a className="hover:text-white" href="#how">How it works</a>
          <a className="hover:text-white" href="#api">API</a>
          <a className="hover:text-white" href="#about">About</a>
        </nav>
        <a className="btn-ghost rounded-pill" href="#">Dashboard</a>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="pt-16 text-center">
      <h1 className="text-balance text-5xl md:text-7xl font-extrabold tracking-tight leading-tight">
        <span className="block">Have I Been </span>
        <span className="bg-gradient-to-r from-brand-400 to-indigo-400 bg-clip-text text-transparent">Pwned-style</span>
        <span className="block"> credibility check</span>
      </h1>
      <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-300">
        Check a headline or URL. Clean, fast, and clear.
      </p>
    </section>
  );
}

function ResultPanel({ result }) {
  const score = Number(result.score) || 0;
  const label = score >= 0.75 ? "High" : score >= 0.4 ? "Medium" : "Low";
  const bar = score >= 0.75 ? "bg-emerald-500" : score >= 0.4 ? "bg-amber-400" : "bg-rose-500";
  const chip = score >= 0.75 ? "pill-green" : score >= 0.4 ? "pill-amber" : "pill-rose";

  return (
    <section className="mx-auto mt-8 max-w-3xl">
      <div className="card p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-400">Credibility score (0–1)</p>
            <p className="text-4xl font-bold tabular-nums">{score.toFixed(2)}</p>
          </div>
          <span className={chip}>{label} confidence</span>
        </div>
        <div className="mt-4 h-2 w-full overflow-hidden rounded-pill bg-slate-800">
          <div className={`h-full ${bar}`} style={{ width: `${Math.min(score * 100, 100)}%` }} />
        </div>
        {result.explanations?.length > 0 && (
          <ul className="mt-5 list-disc space-y-1 pl-6 text-slate-200">
            {result.explanations.map((x, i) => (<li key={i}>{x}</li>))}
          </ul>
        )}
        {result.flags?.length > 0 && (
          <div className="mt-3 text-sm text-yellow-300">Flags: {result.flags.join(", ")}</div>
        )}
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer id="about" className="mt-16 border-t border-slate-800/60 py-12 text-sm text-slate-400">
      <div className="container-page grid gap-8 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-2 font-semibold text-slate-200"><Logo /> Fake News Identifier</div>
          <p className="mt-2">A student project estimating credibility of headlines/URLs.</p>
        </div>
        <div id="how">
          <p className="font-semibold text-slate-300">How it works</p>
          <ul className="mt-2 space-y-1">
            <li>Keyword & domain heuristics (MVP)</li>
            <li>Transparent explanations</li>
            <li>Privacy-friendly: only the input you submit</li>
          </ul>
        </div>
        <div id="api">
          <p className="font-semibold text-slate-300">API</p>
          <p className="mt-2">POST <code className="rounded bg-slate-800 px-1 py-0.5">/api/analyze</code></p>
          <p className="mt-1">Body: <code className="rounded bg-slate-800 px-1 py-0.5">{`{ title|string | url|string }`}</code></p>
        </div>
      </div>
      <p className="container-page mt-10 text-xs text-slate-500">© {new Date().getFullYear()} Team Fake News Identifier — Built with React & Tailwind.</p>
    </footer>
  );
}

function Logo() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" className="text-brand-400">
      <path fill="currentColor" d="M12 2a10 10 0 1 0 10 10A10.011 10.011 0 0 0 12 2m0 3a7 7 0 1 1-7 7a7.008 7.008 0 0 1 7-7m-1 4h2v4h-2zm0 6h2v2h-2z"/>
    </svg>
  );
}
