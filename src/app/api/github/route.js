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

    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);

    const url =
      `https://api.github.com/search/repositories` +
      `?q=AI+machine+learning+pushed:>=${since}` +
      `&sort=stars&order=desc&per_page=24`;

    const r = await fetch(url);
    const j = await r.json();

    const items = j.items || [];

    cache = {
      data: items,
      timestamp: now,
    };

    return Response.json(items);
  } catch {
    return Response.json([], { status: 200 });
  }
}
