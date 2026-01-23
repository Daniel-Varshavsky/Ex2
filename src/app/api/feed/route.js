export async function GET() {
  try {
    const [gh, hf] = await Promise.all([
      fetch("http://localhost:3000/api/github").then((r) => r.json()),
      fetch("http://localhost:3000/api/huggingface").then((r) => r.json()),
    ]);

    const merged = [...gh, ...hf];

    merged.sort((a, b) => {
      // Primary: stars/likes
      if (b.stars !== a.stars) {
        return b.stars - a.stars;
      }
      // Secondary: recency
      return new Date(b.updated_at) - new Date(a.updated_at);
    });

    return Response.json(merged);
  } catch (e) {
    return Response.json([], { status: 200 });
  }
}