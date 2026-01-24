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

    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-5-haiku-20241022",
        max_tokens: 100,
        temperature: 0.3,
        // ✅ CONSISTENT PROMPTING - matches Groq/ChatGPT exactly
        messages: [
          {
            role: "user",
            content: `Summarize the following text in English, in 3 short lines. Do NOT add any extra words like "Here's a summary". Only summarize the content:\n\n${text}`,
          },
        ],
      }),
    });

    const j = await r.json();

    if (!r.ok) {
      console.error("Anthropic error:", j);
      return Response.json(
        { error: j.error?.message || "Anthropic request failed" },
        { status: r.status }
      );
    }

    const summary = j.content?.[0]?.text?.trim() ?? "";

    cache.set(text, { value: summary, time: Date.now() });

    return Response.json({ summary });
  } catch (err) {
    console.error("Anthropic summarize error:", err);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}