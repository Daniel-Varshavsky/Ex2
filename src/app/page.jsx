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
      console.log("🏠 HOMEPAGE: Starting data fetch...", new Date().toISOString());
      console.log("🌐 HOMEPAGE: Current URL:", window.location.href);
      console.log("🔍 HOMEPAGE: User agent:", navigator.userAgent);
      
      setErr("");
      setLoading(true);

      try {
        console.log("📡 HOMEPAGE: Calling /api/feed...");
        const startTime = Date.now();
        
        const res = await fetch("/api/feed", { 
          cache: "no-store",
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'AI-Trends-HomePage/1.0'
          }
        });
        
        const fetchTime = Date.now() - startTime;
        console.log("⏱️ HOMEPAGE: Feed fetch took", fetchTime, "ms");
        console.log("📡 HOMEPAGE: Feed response:", res.status, res.statusText);
        console.log("📋 HOMEPAGE: Feed headers:", Object.fromEntries(res.headers.entries()));

        // Get response as text first for debugging
        const text = await res.text();
        console.log("📄 HOMEPAGE: Raw response length:", text.length);
        console.log("📄 HOMEPAGE: Raw response preview:", text.substring(0, 200) + (text.length > 200 ? '...' : ''));

        if (!res.ok) {
          console.error("❌ HOMEPAGE: Feed request failed:", res.status, text);
          throw new Error(text || `HTTP ${res.status}`);
        }

        let data;
        try {
          data = JSON.parse(text);
          console.log("✅ HOMEPAGE: JSON parsed successfully");
        } catch (parseError) {
          console.error("💥 HOMEPAGE: JSON parse error:", parseError.message);
          console.error("💥 HOMEPAGE: Trying to parse:", text);
          throw new Error("Invalid JSON response from server");
        }
        
        console.log("📊 HOMEPAGE: Data type:", typeof data, Array.isArray(data) ? `(array with ${data.length} items)` : '');
        
        if (Array.isArray(data)) {
          console.log("🎯 HOMEPAGE: Setting repos with", data.length, "items");
          if (data.length > 0) {
            console.log("📝 HOMEPAGE: First item:", {
              id: data[0].id,
              title: data[0].title,
              source: data[0].source,
              stars: data[0].stars
            });
          }
          setRepos(data);
        } else {
          console.warn("⚠️ HOMEPAGE: Data is not an array:", data);
          setRepos([]);
        }
        
      } catch (e) {
        console.error("💥 HOMEPAGE: Error during fetch:", e.message);
        console.error("💥 HOMEPAGE: Error stack:", e.stack);
        setRepos([]);
        setErr(
          `Failed to load data: ${e.message}. Check console for details.`
        );
      } finally {
        setLoading(false);
        console.log("🏁 HOMEPAGE: Data fetch completed");
      }
    })();
  }, []);

  console.log("🎨 HOMEPAGE: Rendering with", repos.length, "repos, loading:", loading, "error:", !!err);

  return (
    <main className="container">
      <header className="topbar">
        <div>
          <h1 className="h1">🔍 AI Trends DEBUG</h1>
          <p className="sub">Debug version - Hot AI/ML repos updated since {weekSince}.</p>
        </div>
      </header>

      <Link href="/settings" className="settingsBtn" aria-label="Settings">
        ⚙️
      </Link>

      {/* Debug panel */}
      <section className="panel">
        <div className="panelTitle">🛠️ Debug Info</div>
        <div className="panelText">
          <strong>Loading:</strong> {loading ? 'Yes' : 'No'}<br />
          <strong>Repos count:</strong> {repos.length}<br />
          <strong>Error:</strong> {err || 'None'}<br />
          <br />
          <strong>Direct API Tests:</strong><br />
          <a href="/api/feed" target="_blank" rel="noopener">🔗 Test Feed API</a> |{' '}
          <a href="/api/github" target="_blank" rel="noopener">🔗 Test GitHub API</a> |{' '}
          <a href="/api/huggingface" target="_blank" rel="noopener">🔗 Test HuggingFace API</a>
        </div>
      </section>

      {err ? (
        <section className="panel">
          <div className="panelTitle">⚠️ Error Details</div>
          <div className="panelText">{err}</div>
        </section>
      ) : null}

      {loading ? (
        <div className="hint">Loading… (check console for details)</div>
      ) : (
        <section className="grid">
          {repos.length === 0 ? (
            <div className="hint">
              No repositories found. 
              <br />
              Check the console logs and try the direct API links above.
              <br />
              <br />
              <strong>Troubleshooting:</strong>
              <br />
              1. Open browser console (F12)
              <br />
              2. Look for 🔍 🤗 📡 🏠 emoji logs  
              <br />
              3. Click the API test links above
              <br />
              4. Report what you see in console
            </div>
          ) : (
            repos.map((r) => (
              <NewsCard key={r.id} repo={r} />
            ))
          )}
        </section>
      )}
    </main>
  );
}