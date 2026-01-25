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
    // Only show placeholder for HuggingFace models with README URLs
    repo.source === "huggingface" && repo.description.startsWith("http")
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
            let readmeContent = data.readme;
            
            // Handle large README files - truncate if necessary
            const maxReadmeLength = 8000; // Safe limit for most AI APIs
            if (readmeContent.length > maxReadmeLength) {
              console.log(`📝 ${source.toUpperCase()} README: Large file (${readmeContent.length} chars), truncating to ${maxReadmeLength}`);
              
              // Try to truncate at a reasonable point (paragraph or section break)
              const truncatedContent = readmeContent.substring(0, maxReadmeLength);
              const lastParagraph = truncatedContent.lastIndexOf('\n\n');
              const lastSentence = truncatedContent.lastIndexOf('. ');
              
              if (lastParagraph > maxReadmeLength * 0.7) {
                // Truncate at paragraph break if it's not too early
                readmeContent = truncatedContent.substring(0, lastParagraph) + '\n\n[README truncated - this covers the main sections]';
              } else if (lastSentence > maxReadmeLength * 0.8) {
                // Truncate at sentence break
                readmeContent = truncatedContent.substring(0, lastSentence + 1) + ' [README truncated]';
              } else {
                // Just truncate and add note
                readmeContent = truncatedContent + '... [README truncated]';
              }
              
              console.log(`📝 ${source.toUpperCase()} README: Truncated to ${readmeContent.length} characters`);
            }
            
            textToSummarize = readmeContent;
            
            // Additional validation - if README is too short, use fallback
            if (textToSummarize.trim().length < 100) {
              console.log(`📝 ${source.toUpperCase()} README: Too short (${textToSummarize.length} chars), using fallback`);
              throw new Error("README too short, using knowledge-based summary");
            }
            
            console.log(`✅ ${source.toUpperCase()} README fetched, final length:`, textToSummarize.length);
          } else {
            // Handle any HTTP error (including 500)
            console.warn(`⚠️ ${source.toUpperCase()} README fetch failed:`, readmeRes.status);
            const errorData = await readmeRes.json().catch(() => ({}));
            console.warn(`⚠️ README error details:`, errorData);
            throw new Error(`README not accessible (${readmeRes.status})`);
          }
        } catch (readmeError) {
          console.log(`📝 ${source.toUpperCase()} README: Access failed -`, readmeError.message);
          
          // Fallback: Try to summarize the webpage instead
          console.log(`🌐 ${source.toUpperCase()}: Trying webpage summarization fallback for`, url);
          
          if (source === "huggingface") {
            textToSummarize = `Please provide a brief technical summary of this Hugging Face model: ${title}. This is a ${lang || 'machine learning'} model with ${stars} likes. Focus on what type of AI model this is and what it's used for.`;
          } else {
            textToSummarize = `Please provide a brief technical summary of this GitHub repository: ${title}. This is a ${lang || 'software'} project with ${stars} stars. ${repo.description && repo.description !== "No description provided." ? "Current description: " + repo.description + ". " : ""}Focus on what this software does and its main features.`;
          }
          console.log(`🌐 Using ${source} webpage summarization prompt`);
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
        if (source === "github") {
          textToSummarize = `Please provide a brief summary of this GitHub repository: ${title}. This is a ${lang || 'software'} project with ${stars} stars. Focus on what this software does based on its name and programming language.`;
        } else {
          textToSummarize = `Please provide a brief summary of this Hugging Face model: ${title}. This is a ${lang || 'AI'} model with ${stars} likes. Focus on what type of AI model this is and its applications.`;
        }
        console.log("🌐 Using AI knowledge-based fallback");
      }

      console.log("📤 Sending to AI:", {
        provider: provider,
        endpoint: endpoint,
        textLength: textToSummarize.length,
        textPreview: textToSummarize.substring(0, 100) + "...",
        isTruncated: textToSummarize.includes("[README truncated")
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