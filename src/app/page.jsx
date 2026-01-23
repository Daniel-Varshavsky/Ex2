"use client";

import { useEffect, useMemo, useState } from "react";
import NewsCard from "../components/NewsCard";
import Link from "next/link";

function isoDateDaysAgo(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

export default function HomePage() {
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const weekSince = useMemo(() => isoDateDaysAgo(7), []);

  useEffect(() => {
    (async () => {
      setErr("");
      setLoading(true);

      try {
        const res = await fetch("/api/feed", { cache: "no-store" });

        // 👇 דיבוג: תראה מה השרת החזיר
        const text = await res.text();
        console.log("GET /api/github ->", res.status, text);

        if (!res.ok) throw new Error(text || `HTTP ${res.status}`);

        const data = JSON.parse(text);
        setRepos(Array.isArray(data) ? data : []);
      } catch (e) {
        setRepos([]);
        setErr(
          "Failed to load GitHub feed. Open /api/github in the browser and check console."
        );
        console.error("Feed load error:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <main className="container">
      <header className="topbar">
        <div>
          <h1 className="h1">AI Trends</h1>
          <p className="sub">Hot AI/ML repos updated since {weekSince}.</p>
        </div>
      </header>

      <Link href="/settings" className="settingsBtn" aria-label="Settings">
        ⚙️
      </Link>


      {err ? (
        <section className="panel">
          <div className="panelTitle">Couldn't load feed</div>
          <div className="panelText">{err}</div>
        </section>
      ) : null}

      {loading ? (
        <div className="hint">Loading…</div>
      ) : (
        <section className="grid">
          {repos.map((r) => (
            <NewsCard key={r.id} repo={r} />
          ))}
        </section>
      )}
    </main>
  );
}