"use client";

import { useEffect, useState } from "react";

export default function Settings() {
  const [key, setKey] = useState("");
  const [saved, setSaved] = useState(false);
  const [provider, setProvider] = useState("Groq");
  const [deploying, setDeploying] = useState(false);
  const [deployStatus, setDeployStatus] = useState(null);

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

  async function handleDeploy() {
    setDeploying(true);
    setDeployStatus(null);

    try {
      const res = await fetch("/api/vercel", { method: "POST" });
      const data = await res.json();
      
      if (res.ok) {
        setDeployStatus({
          type: 'success',
          message: data.message || 'Deployment started!',
          info: data.info,
          time: new Date().toLocaleTimeString()
        });
        
        // Show success alert with better messaging
        alert(`✅ ${data.message}\n\n${data.info || 'Check your Vercel dashboard for progress.'}`);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      setDeployStatus({
        type: 'error',
        message: error.message,
        time: new Date().toLocaleTimeString()
      });
      
      alert(`❌ Deployment failed: ${error.message}`);
    } finally {
      setDeploying(false);
    }
  }

  return (
    <main className="container">
      {/* API Settings Section */}
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

      {/* Deployment Section */}
      <section className="settingsCard">
        <h2 className="settingsTitle">Deployment</h2>
        <p className="settingsLabel">Deploy your changes to production</p>
        
        <button
          className={`btn ${deploying ? '' : 'btnPrimary'}`}
          onClick={handleDeploy}
          disabled={deploying}
        >
          {deploying ? 'Deploying...' : 'Deploy to Vercel'}
        </button>

        {deployStatus && (
          <div 
            className="deployStatus"
            style={{
              marginTop: '12px',
              padding: '10px',
              borderRadius: '8px',
              fontSize: '14px',
              backgroundColor: deployStatus.type === 'success' ? '#f0f9f0' : '#fdf2f2',
              color: deployStatus.type === 'success' ? '#166534' : '#991b1b',
              border: `1px solid ${deployStatus.type === 'success' ? '#bbf7d0' : '#fecaca'}`
            }}
          >
            <div style={{ fontWeight: 'bold' }}>
              {deployStatus.type === 'success' ? '✅' : '❌'} {deployStatus.message}
            </div>
            {deployStatus.info && (
              <div style={{ marginTop: '4px', fontSize: '12px' }}>
                {deployStatus.info}
              </div>
            )}
            <div style={{ marginTop: '4px', fontSize: '12px', opacity: 0.7 }}>
              {deployStatus.time}
            </div>
          </div>
        )}

        <div style={{ marginTop: '12px', fontSize: '13px', color: 'var(--muted)' }}>
          <strong>How it works:</strong> This triggers a new deployment of your app using the latest code from your Git repository.
        </div>
      </section>
    </main>
  );
}