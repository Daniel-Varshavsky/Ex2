let cache = new Map();
const TTL = 5 * 60 * 1000; // 5 minutes

export async function POST(req) {
  try {
    const { text } = await req.json();
    const apiKey = req.headers.get("x-api-key");

    if (!apiKey || !text) {
      return Response.json({ error: "Missing input" }, { status: 400 });
    }

    // Cache check
    const cached = cache.get(text);
    if (cached && Date.now() - cached.time < TTL) {
      return Response.json({ summary: cached.value });
    }

    // Enhanced prompt for better handling of truncated content
    let prompt = "Summarize the following text in English, in 3 short lines. Do NOT add any extra words like \"Here's a summary\". Only summarize the content";
    
    // Add special instruction for truncated content
    if (text.includes("[README truncated") || text.includes("... [README truncated]")) {
      prompt += ". Note: This content was truncated from a larger document, so focus on the main topics covered";
    }
    
    prompt += ":\n\n";

    const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          { role: "user", content: prompt + text }
        ],
      }),
    });

    const j = await r.json();

    if (!r.ok) {
      return Response.json(
        { error: j.error?.message || "Groq request failed" },
        { status: r.status }
      );
    }

    const summary = j.choices?.[0]?.message?.content ?? "";

    cache.set(text, { value: summary, time: Date.now() });

    return Response.json({ summary });
  } catch (err) {
    console.log("Groq summarize error:", err);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}