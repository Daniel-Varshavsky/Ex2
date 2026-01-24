let cache = new Map();
const TTL = 5 * 60 * 1000;

export async function POST(req) {
  try {
    const { text } = await req.json();
    const apiKey = req.headers.get("x-api-key");

    if (!apiKey || !text) {
      return Response.json({ error: "Missing input" }, { status: 400 });
    }

    const cached = cache.get(text);
    if (cached && Date.now() - cached.time < TTL) {
      return Response.json({ summary: cached.value });
    }

    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user", 
            content: `Summarize the following text in English, in 3 short lines. Do NOT add any extra words like "Here's a summary". Only summarize the content:\n\n${text}`
          }
        ],
        max_tokens: 100,
        temperature: 0.3,
      }),
    });

    const j = await r.json();

    if (!r.ok) {
      console.error("OpenAI error:", j);
      return Response.json(
        { error: j.error?.message || "OpenAI request failed" },
        { status: r.status }
      );
    }

    // ✅ CORRECT response parsing
    const summary = j.choices?.[0]?.message?.content?.trim() ?? "";

    cache.set(text, { value: summary, time: Date.now() });

    return Response.json({ summary });
  } catch (err) {
    console.error("Summarize route error:", err);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}