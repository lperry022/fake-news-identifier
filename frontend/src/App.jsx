import { useState } from "react";

/**
 * Fake News Identifier – Enhanced HIBP‑style landing page
 * - Gradient background with animated glow
 * - Polished navbar with hover effects
 * - Hero with gradient text + subheading
 * - Centered input card with shadow
 * - Styled result card with progress bar
 * - Animated stats cards
 * - Responsive footer
 */

export default function App() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setResult(null);
    setLoading(true);
    try {
      const body = query.trim().startsWith("http")
        ? { url: query.trim() }
        : { title: query.trim() };

      const r = await fetch(`${import.meta.env.VITE_API_BASE}/api/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error(j.error || `Request failed (${r.status})`);
      }
      const j = await r.json();
      setResult(j);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      <SiteNav />

      {/* background glow */}
      <div className="pointer-events-none fixed inset-0 -z-10 animate-pulse">
        <div className="absolute inset-0 bg-[radial-gradient(1000px_600px_at_50%_-10%,rgba(99,102,241,0.25),transparent_70%)]" />
      </div>

      <main className="mx-auto max-w-5xl px-4 pb-24">
        <Hero />

        <form
          onSubmit={onSubmit}
          className="mx-auto mt-10 flex max-w-2xl gap-3 rounded-2xl bg-slate-900/70 p-6 shadow-xl backdrop-blur"
        >
          <label htmlFor="query" className="sr-only">Headline or URL</label>
          <input
            id="query"
            required
            minLength={3}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Paste a headline or URL…"
            className="flex-1 rounded-xl bg-slate-800 px-5 py-4 text-slate-100 placeholder:text-slate-400 outline-none ring-1 ring-slate-700 focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-indigo-600 px-6 py-4 font-semibold shadow-lg shadow-indigo-900/40 transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
            aria-busy={loading}
          >
            {loading ? "Checking…" : "Check"}
          </button>
        </form>

        {error && (
          <p className="mx-auto mt-4 max-w-2xl rounded-xl bg-red-500/10 p-3 text-red-300 ring-1 ring-red-500/30" role="alert">
            {error}
          </p>
        )}

        {result && <ResultPanel result={result} />}

        <StatsBand />
      </main>

      <SiteFooter />
    </div>
  );
}

function SiteNav() {
  return (
    <header className="sticky top-0 z-10 border-b border-slate-800/60 bg-slate-950/70 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <a href="#" className="group inline-flex items-center gap-2">
          <Logo />
          <span className="text-lg font-semibold tracking-tight group-hover:text-indigo-400 transition">Fake News Identifier</span>
        </a>
        <nav className="hidden gap-6 text-sm text-slate-300 md:flex">
          <a className="hover:text-indigo-400 transition" href="#how">How it works</a>
          <a className="hover:text-indigo-400 transition" href="#api">API</a>
          <a className="hover:text-indigo-400 transition" href="#about">About</a>
        </nav>
        <a
          href="#"
          className="rounded-xl border border-slate-700/70 px-3 py-1.5 text-sm text-slate-200 hover:border-indigo-500 hover:text-indigo-400 transition"
        >Dashboard</a>
      </div>
    </header>
  );
}

function Logo() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" className="text-indigo-400">
      <path fill="currentColor" d="M12 2a10 10 0 1 0 10 10A10.011 10.011 0 0 0 12 2m0 3a7 7 0 1 1-7 7a7.008 7.008 0 0 1 7-7m-1 4h2v4h-2zm0 6h2v2h-2z" />
    </svg>
  );
}

function Hero() {
  return (
    <section className="pt-20 text-center">
      <h1 className="text-balance bg-gradient-to-r from-indigo-400 to-sky-400 bg-clip-text text-5xl font-extrabold leading-tight tracking-tight text-transparent md:text-7xl">
        Check if a headline is credible
      </h1>
      <p className="mx-auto mt-5 max-w-2xl text-pretty text-lg text-slate-300">
        Paste a news headline or URL below to instantly see a credibility score with explanations and warning flags.
      </p>
    </section>
  );
}

function ResultPanel({ result }) {
  return (
    <section aria-live="polite" className="mx-auto mt-10 max-w-2xl">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-lg shadow-slate-900/40">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-400">Credibility score</p>
            <p className="text-4xl font-bold tabular-nums">{Number(result.score).toFixed(2)}</p>
          </div>
          <ScoreBadge value={result.score} />
        </div>
        <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-slate-800">
          <div
            className={`h-full ${result.score >= 0.75 ? "bg-emerald-500" : result.score >= 0.4 ? "bg-amber-400" : "bg-rose-500"}`}
            style={{ width: `${Math.min(result.score * 100, 100)}%` }}
          />
        </div>
        {result.explanations?.length > 0 && (
          <ul className="mt-5 list-disc space-y-1 pl-6 text-slate-200">
            {result.explanations.map((x, i) => (
              <li key={i}>{x}</li>
            ))}
          </ul>
        )}
        {result.flags?.length > 0 && (
          <div className="mt-3 text-sm text-yellow-300">Flags: {result.flags.join(", ")}</div>
        )}
      </div>
    </section>
  );
}

function ScoreBadge({ value = 0 }) {
  let label = "Low";
  if (value >= 0.75) label = "High";
  else if (value >= 0.4) label = "Medium";
  const color = label === "High" ? "bg-emerald-500/20 text-emerald-300 ring-emerald-500/30" : label === "Medium" ? "bg-amber-500/20 text-amber-300 ring-amber-500/30" : "bg-rose-500/20 text-rose-300 ring-rose-500/30";
  return (
    <span className={`rounded-full px-3 py-1 text-sm font-medium ring-1 ${color}`}>{label} confidence</span>
  );
}

function StatsBand() {
  return (
    <section className="mx-auto mt-16 grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-3">
      <StatCard label="articles checked" value="903" />
      <StatCard label="total assessments" value="15,098" />
      <StatCard label="last update" value={new Date().toLocaleDateString()} />
    </section>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 text-center shadow hover:shadow-indigo-900/30 transition">
      <div className="text-3xl font-bold tabular-nums text-indigo-300">{value}</div>
      <div className="mt-1 text-sm uppercase tracking-wide text-slate-400">{label}</div>
    </div>
  );
}

function SiteFooter() {
  return (
    <footer id="about" className="mt-24 border-t border-slate-800/60 py-12 text-sm text-slate-400">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-2 font-semibold text-slate-200"><Logo /> Fake News Identifier</div>
          <p className="mt-2 text-slate-400">A student project estimating credibility of news headlines/URLs for learning purposes.</p>
        </div>
        <div id="how">
          <p className="font-semibold text-slate-300">How it works</p>
          <ul className="mt-2 space-y-1">
            <li>Keyword & domain heuristics (MVP)</li>
            <li>Transparent explanations</li>
            <li>Privacy‑friendly: only the input you submit</li>
          </ul>
        </div>
        <div id="api">
          <p className="font-semibold text-slate-300">API</p>
          <p className="mt-2">POST <code className="rounded bg-slate-800 px-1 py-0.5">/api/analyze</code></p>
          <p className="mt-1">Body: <code className="rounded bg-slate-800 px-1 py-0.5">{`{ title|string | url|string }`}</code></p>
        </div>
      </div>
      <p className="mx-auto mt-10 max-w-6xl px-4 text-xs text-slate-500">© {new Date().getFullYear()} Team Fake News Identifier — Built with React & Tailwind.</p>
    </footer>
  );
}
