"use client";

import { useEffect, useState } from "react";

export default function Settings() {
  const [key, setKey] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const existing = localStorage.getItem("API_KEY");
    if (existing) setKey(existing);
  }, []);

  function saveKey() {
    if (!key.trim()) {
      alert("API key cannot be empty.");
      return;
    }

    localStorage.setItem("API_KEY", key.trim());
    setSaved(true);

    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <main className="container">
      <section className="settingsCard">
        <h1 className="settingsTitle">Settings</h1>

        <label className="settingsLabel">OpenAI API Key</label>

        <input
          className="settingsInput"
          placeholder="sk-..."
          value={key}
          onChange={(e) => setKey(e.target.value)}
        />

        <button className="settingsSaveBtn" onClick={saveKey}>
          Save API Key
        </button>

        {saved && <div className="settingsSaved">✓ API key saved</div>}
      </section>
    </main>
  );
}