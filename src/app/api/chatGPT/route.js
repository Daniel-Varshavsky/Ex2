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
            role: "system",
            content: "Summarize the following text in up to 3 short lines.",
          },
          { role: "user", content: text },
        ],
      }),
    });

    const j = await r.json();

    if (!r.ok) {
      return Response.json(
        { error: j.error?.message || "OpenAI request failed" },
        { status: r.status }
      );
    }

    const summary = j.choices?.[0]?.message?.content ?? "";

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