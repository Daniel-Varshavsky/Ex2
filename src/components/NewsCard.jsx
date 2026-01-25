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
    // For both GitHub and HuggingFace, show placeholder if we have README URL
    (repo.source === "huggingface" && repo.description.startsWith("http")) || 
    (repo.source === "github" && repo.readme_url)
      ? "Click on summarize to get detailed description." 
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
  

  const provider = localStorage.getItem("AI_PROVIDER") || "Groq";

  const endpointMap = {
    Groq: "/api/groq",
    OpenAI: "/api/openai",
    Anthropic: "/api/anthropic",
  };

  const endpoint = endpointMap[provider];

  // README URLs for both platforms
  const README_URL = repo.source === "huggingface" 
    ? repo.description 
    : repo.readme_url;

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

      let textToSummarize = "";

      // Check if we should fetch README for either platform
      if (README_URL && README_URL.startsWith("http")) {
        try {
          console.log(`📖 Fetching ${source.toUpperCase()} README:`, README_URL);
          
          const readmeEndpoint = source === "huggingface" ? "/api/huggingface" : "/api/github";
          
          const readmeRes = await fetch(readmeEndpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ url: README_URL }),
          });
          
          if (readmeRes.ok) {
            const data = await readmeRes.json();
            textToSummarize = data.readme;
            console.log(`✅ ${source.toUpperCase()} README fetched, length:`, textToSummarize.length);
          } else {
            // Handle any HTTP error (including 500)
            console.warn(`⚠️ ${source.toUpperCase()} README fetch failed:`, readmeRes.status);
            const errorData = await readmeRes.json().catch(() => ({}));
            console.warn(`⚠️ README error details:`, errorData);
            throw new Error(`README not accessible (${readmeRes.status})`);
          }
        } catch (readmeError) {
          console.log(`📝 ${source.toUpperCase()} README: Access failed -`, readmeError.message);
          
          // Fallback: Use repository/model information
          if (source === "huggingface") {
            textToSummarize = `${title} is a ${lang || 'machine learning'} model on Hugging Face with ${stars} likes. This is a ${lang || 'AI'} model for machine learning applications.`;
          } else {
            textToSummarize = `${title} is a GitHub repository for ${lang || 'software development'} with ${stars} stars. ${repo.description && repo.description !== "No description provided." ? "Description: " + repo.description : ""}`;
          }
          console.log(`📝 Using ${source} fallback text for summarization`);
        }
      } else {
        // Use the existing description (for cases where README URL isn't available)
        textToSummarize = desc;
        console.log(`🔍 Using ${source} description:`, {
          description: desc,
          length: desc ? desc.length : 0,
          type: typeof desc,
          isEmpty: !desc || desc.trim() === "",
          isNoDescription: desc === "No description provided."
        });

        // For very short GitHub descriptions, enhance them
        if (source === "github" && desc && desc.trim() !== "" && desc !== "No description provided." && desc.length < 50) {
          console.log("⚠️ GitHub description too short, enhancing...");
          textToSummarize = `${title} is a GitHub repository with the description: "${desc}". This is a ${lang || 'software'} project with ${stars} stars.`;
          console.log("🔄 Enhanced GitHub text:", textToSummarize);
        }
      }

      // Final validation and fallback
      if (!textToSummarize || textToSummarize.trim() === "" || textToSummarize === "No description provided.") {
        textToSummarize = `${title} is a ${source === 'github' ? 'GitHub repository' : 'Hugging Face model'} for ${lang || 'software development'} with ${stars} stars/likes.`;
        console.log("🔄 Using generic fallback text:", textToSummarize);
      }

      console.log("📤 Sending to AI:", {
        provider: provider,
        endpoint: endpoint,
        textLength: textToSummarize.length,
        textPreview: textToSummarize.substring(0, 100) + "..."
      });

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": key,
        },
        body: JSON.stringify({ text: textToSummarize }),
      });

      console.log("📥 AI Response:", res.status, res.statusText);

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.log("📝 AI API: Request failed", res.status, errorData);
        throw new Error(errorData.error || "Summarization failed");
      }

      const responseData = await res.json();
      console.log("📋 AI Response Data:", responseData);

      const { summary } = responseData;

      // Check for problematic AI responses
      if (!summary || summary.trim() === "") {
        console.error("❌ Empty summary received");
        throw new Error("Empty summary received from AI");
      }

      if (summary.toLowerCase().includes("no text provided") || 
          summary.toLowerCase().includes("there is no text provided") ||
          summary.toLowerCase().includes("no text has been provided") ||
          summary.toLowerCase().includes("please give the text to be summarized")) {
        console.error("❌ AI says no text provided. Original text was:", textToSummarize);
        throw new Error("Description too short or unclear for AI to summarize");
      }

      console.log("✅ Summary received:", summary);
      setDesc(summary);
    } catch (e) {
      console.log("📝 Summarization:", e.message);
      alert(`Failed to summarize: ${e.message}. This is expected for some restricted content.`);
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