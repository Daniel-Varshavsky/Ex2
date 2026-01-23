let cache = {
  data: null,
  timestamp: 0,
};

const TTL = 5 * 60 * 1000; // 5 minutes

export async function GET() {
  try {
    const now = Date.now();

    if (cache.data && now - cache.timestamp < TTL) {
      return Response.json(cache.data);
    }

    const url =
      "https://huggingface.co/api/models" +
      "?pipeline_tag=text-generation" +
      "&sort=likes&direction=-1&limit=24";

    const r = await fetch(url);
    const models = await r.json();

    const items = (models || []).map((m) => {
        const [owner] = m.id.split("/");

        return {
            id: `hf-${m.id}`,
            source: "huggingface",

            title: m.id,
            description: 
                m.cardData?.description?.trim() ||
                m.cardData?.summary?.trim() ||
                (m.pipeline_tag
                    ? `Hugging Face ${m.pipeline_tag} model.`
                    : "No description provided."),

            url: `https://huggingface.co/${m.id}`,

            stars: m.likes ?? 0,

            language: m.pipeline_tag || "",

            owner,

            avatar: null, // HF doesn't provide this reliably

            updated_at: m.lastModified,
        };
    });

    cache = { data: items, timestamp: now };

    return Response.json(items);
  } catch {
    return Response.json([], { status: 200 });
  }
}