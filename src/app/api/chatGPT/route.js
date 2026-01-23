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

    const r = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        input: `Summarize the following text in English, in 3 short lines. Do NOT add any extra words like "Here's a summary". Only summarize the content:\n\n${text}`,
      }),
    });

    const j = await r.json();

    if (!r.ok) {
      console.error("OpenAI error:", j);
    }

    const summary =
      j.output_text ??
      j.output?.[0]?.content?.[0]?.text ??
      "";

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