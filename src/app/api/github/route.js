export async function GET() {
  try {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);

    const url =
      `https://api.github.com/search/repositories` +
      `?q=AI+machine+learning+pushed:>=${since}` +
      `&sort=stars&order=desc&per_page=24`;

    const r = await fetch(url);
    const j = await r.json();
    return Response.json(j.items || []);
  } catch {
    return Response.json([
      { id: 1, full_name: "demo/ai", description: "fetch failed" },
    ]);
  }
}
