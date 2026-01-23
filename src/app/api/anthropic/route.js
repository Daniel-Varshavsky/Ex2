import Anthropic from "@anthropic-ai/sdk";

export async function POST(req) {
  const apiKey = req.headers.get("x-api-key");
  if (!apiKey) {
    return Response.json({ error: "Missing API key" }, { status: 401 });
  }

  const { text } = await req.json();

  const client = new Anthropic({ apiKey });

  const response = await client.messages.create({
    model: "claude-3-haiku-20240307",
    max_tokens: 100,
    temperature: 0.3,
    system: `
You are a summarization assistant.

SKILL: Summarization
- Output exactly 3 short bullet points
- Always respond in English
- Do not add introductions or explanations
- Do not mention that this is a summary
`,
    messages: [
      {
        role: "user",
        content: text,
      },
    ],
  });

  const summary = response.content[0].text.trim();

  return Response.json({ summary });
}