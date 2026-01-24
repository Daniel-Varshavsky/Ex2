"use client";

import { useEffect, useState } from "react";

export default function Settings() {
  const [key, setKey] = useState("");
  const [saved, setSaved] = useState(false);
  const [provider, setProvider] = useState("Groq");

  useEffect(() => {
    const existingKey = localStorage.getItem("API_KEY");
    const existingProvider = localStorage.getItem("AI_PROVIDER");

    if (existingKey) setKey(existingKey);
    if (existingProvider) setProvider(existingProvider);
  }, []);

  function saveKey() {
    if (!key.trim()) {
      alert("API key cannot be empty.");
      return;
    }

    localStorage.setItem("API_KEY", key.trim());
    localStorage.setItem("AI_PROVIDER", provider);
    setSaved(true);

    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <main className="container">
      <section className="settingsCard">
        <h1 className="settingsTitle">Settings</h1>

        <label className="settingsLabel">{provider} API Key</label>

        <input
          className="settingsInput"
          type="password"
          onCopy={(e) => e.preventDefault()}
          onCut={(e) => e.preventDefault()}
          value={key}
          onChange={(e) => setKey(e.target.value)}
          autoComplete="off"
        />

        <label className="settingsLabel">AI Provider</label>

        <select
          className="settingsInput"
          value={provider}
          onChange={(e) => setProvider(e.target.value)}
        >
          <option value="Groq">Groq</option>
          <option value="OpenAI">OpenAI</option>
          <option value="Anthropic">Anthropic</option>
        </select>


        <button className="settingsSaveBtn" onClick={saveKey}>
          Save API Key
        </button>

        {saved && <div className="settingsSaved">✓ API key saved</div>}
      </section>
      <section className="settingsCard">
        <button
          className="btn btnPrimary"
          onClick={async () => {
            try {
              const res = await fetch("/api/vercel", { method: "POST" });
              const data = await res.json();
              if (res.ok) {
                alert(`Deployment started! Preview at ${data.url}`);
              } else {
                alert(`Deployment failed: ${data.error}`);
              }
            } catch (e) {
              alert(`Error: ${e.message}`);
            }
          }}
        >
          Deploy to Vercel
        </button>
      </section>
    </main>
  );
}