let cache = {
  data: null,
  timestamp: 0,
};

const TTL = 5 * 60 * 1000; // 5 minutes

export async function GET() {
  console.log("🔍 GITHUB ROUTE CALLED:", new Date().toISOString());
  console.log("📍 Environment:", {
    NODE_ENV: process.env.NODE_ENV,
    VERCEL: process.env.VERCEL,
    VERCEL_URL: process.env.VERCEL_URL
  });
  
  try {
    const now = Date.now();

    // Check cache
    if (cache.data && now - cache.timestamp < TTL) {
      console.log("✅ GITHUB: Using cached data, items:", cache.data.length);
      return Response.json(cache.data);
    }
    console.log("🔄 GITHUB: Cache miss, fetching fresh data");

    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);

    const url =
      `https://api.github.com/search/repositories` +
      `?q=AI+machine+learning+pushed:>=${since}` +
      `&sort=stars&order=desc&per_page=24`;

    console.log("🌐 GITHUB: Fetching URL:", url);

    const r = await fetch(url, {
      headers: {
        'User-Agent': 'AI-Trends-App/1.0',
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    console.log("📡 GITHUB: Response status:", r.status, r.statusText);
    console.log("📡 GITHUB: Rate limit headers:", {
      remaining: r.headers.get('x-ratelimit-remaining'),
      reset: r.headers.get('x-ratelimit-reset'),
      used: r.headers.get('x-ratelimit-used')
    });

    if (!r.ok) {
      const errorText = await r.text();
      console.error("❌ GITHUB: API Error:", r.status, errorText);
      return Response.json([], { status: 200 });
    }

    const j = await r.json();
    console.log("📊 GITHUB: API Response:", {
      total_count: j.total_count,
      items_length: j.items?.length || 0,
      message: j.message,
      documentation_url: j.documentation_url
    });

    if (j.message) {
      console.error("⚠️ GITHUB: API Message:", j.message);
    }

    const items = (j.items || []).map((r) => ({
      id: `gh-${r.id}`,
      source: "github",
      title: r.full_name,
      description: r.description || "No description provided.",
      url: r.html_url,
      stars: r.stargazers_count ?? 0,
      language: r.language || "",
      owner: r.owner?.login || "",
      avatar: r.owner?.avatar_url || "",
      updated_at: r.pushed_at,
    }));

    console.log("✨ GITHUB: Processed items:", items.length);
    if (items.length > 0) {
      console.log("📝 GITHUB: First item:", {
        title: items[0].title,
        stars: items[0].stars,
        language: items[0].language
      });
    }

    cache = {
      data: items,
      timestamp: now,
    };

    console.log("💾 GITHUB: Cached", items.length, "items");
    return Response.json(items);
  } catch (error) {
    console.error("💥 GITHUB: Route error:", error.message);
    console.error("💥 GITHUB: Stack:", error.stack);
    return Response.json([], { status: 200 });
  }
}