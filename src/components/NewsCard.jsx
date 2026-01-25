import { useState } from "react";
import styles from "./NewsCard.module.css";
import { getLastSummarizeTime, setLastSummarizeTime } from "../app/lib/summarizeCooldown";

function formatStars(n) {
  if (typeof n !== "number") return "";
  if (n >= 100000) return `${Math.round(n / 1000)}k`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

export default function NewsCard({ repo }) {
  const [desc, setDesc] = useState(
    repo.source === "huggingface"
      ? repo.description.startsWith("http") ? "Click on summarize to get proper description." : repo.description
      : repo?.description || "No description provided."
  );

  const [loading, setLoading] = useState(false);

  const title = repo.title;
  const url = repo.url;
  const stars = repo.stars;
  const lang = repo.language;
  const owner = repo.owner;
  const avatar =
  repo.avatar ||
  (repo.source === "huggingface"
    ? "/hf.svg"
    : "/github.svg");
  const source = repo.source;
  

  const provider = localStorage.getItem("AI_PROVIDER") || "groq";

  const endpointMap = {
    Groq: "/api/groq",
    OpenAI: "/api/openai",
    Anthropic: "/api/anthropic",
  };

  const endpoint = endpointMap[provider];

  const README = repo.source === "huggingface"
      ? repo.description : null

  async function summarize() {
    const now = Date.now();
    if (now - getLastSummarizeTime() < 2000) {
      alert("Please wait a moment before summarizing again.");
    return;
    }

    setLastSummarizeTime(now);
    
    const key = localStorage.getItem("API_KEY");
    if (!key) {
      alert("Please enter an API key in Settings.");
      return;
    }

    try {
      setLoading(true);

      let readmeText = "";

      if (source === "huggingface" && README && README.startsWith("http")) {
        const readmeRes = await fetch("/api/huggingface", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ url: README }),
        });
        
        if (readmeRes.ok) {
          readmeText = await readmeRes.text();
        } else {
          setDesc("Failed to fetch README.");
        }
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": key,
        },
        body: JSON.stringify({ text: source === "huggingface" ? readmeText : desc }),
      });

      if (!res.ok) {
        throw new Error("Summarization failed");
      }

      const { summary } = await res.json();
      setDesc(summary);
    } catch (e) {
      alert("Failed to summarize. Check your API key or try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <article className={styles.card}>
      <div className={styles.header}>
        <div className={styles.identity}>
          {avatar ? <img className={styles.avatar} src={avatar} alt="" /> : null}
          <div className={styles.titles}>
            <a className={styles.title} href={url} target="_blank" rel="noreferrer">
              {title}
            </a>
            <div className={styles.meta}>
              <span className={styles.source}>
                {source === "github" ? "GitHub" : "Hugging Face"}
              </span>
              <span className={styles.owner}>{owner}</span>
              <span className={styles.dot}>•</span>
              <span className={styles.stars}>★ {formatStars(stars)}</span>
              {lang && (
                <>
                  <span className={styles.dot}>•</span>
                  <span className={styles.lang}>{lang}</span>
                </>
              )}
            </div>
          </div>
        </div>

        <a className={styles.openBtn} href={url} target="_blank" rel="noreferrer">
          Open
        </a>
      </div>

      <p className={styles.desc}>{desc}</p>

      <button
        className={styles.summarizeBtn}
        onClick={summarize}
        disabled={loading}
      >
        {loading ? "Summarizing…" : "Summarize"}
      </button>
    </article>
  );
}