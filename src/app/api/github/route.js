let cache = {
  data: null,
  timestamp: 0,
};

const TTL = 5 * 60 * 1000; // 5 minutes

export async function GET() {
  try {
    const now = Date.now();

    // Check cache
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

    const r = await fetch(url, {
      headers: {
        'User-Agent': 'AI-Trends-App/1.0',
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    if (!r.ok) {
      const errorText = await r.text();
      // Use console.log instead of console.error
      console.log("📝 GitHub API: Request failed", r.status, errorText);
      return Response.json([], { status: 200 });
    }

    const j = await r.json();

    if (j.message) {
      console.log("📝 GitHub API: API message:", j.message);
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
      // Add README URL for fetching, similar to HuggingFace
      readme_url: `https://api.github.com/repos/${r.full_name}/readme`,
    }));

    cache = {
      data: items,
      timestamp: now,
    };

    return Response.json(items);
  } catch (error) {
    // Use console.log instead of console.error
    console.log("📝 GitHub route: Error occurred", error.message);
    return Response.json([], { status: 200 });
  }
}

// POST endpoint for fetching GitHub README content
export async function POST(req) {
  try {
    const { url } = await req.json();

    if (!url) {
      return Response.json(
        { error: "URL is required" },
        { status: 400 }
      );
    }

    // Add timeout for README fetching
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'AI-Trends-App/1.0',
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      // Handle errors gracefully without console.error
      if (res.status === 403) {
        console.log("📝 GitHub README: Access forbidden (rate limit or private repo) for", url);
        return Response.json(
          { error: "README access forbidden - rate limit or private repo" },
          { status: 500 }
        );
      } else if (res.status === 404) {
        console.log("📝 GitHub README: Not found for", url);
        return Response.json(
          { error: "README not found" },
          { status: 500 }
        );
      } else if (res.status >= 500) {
        console.log("📝 GitHub README: Server error for", url);
        return Response.json(
          { error: "GitHub server error" },
          { status: 500 }
        );
      } else {
        console.log("📝 GitHub README: HTTP error", res.status, "for", url);
        return Response.json(
          { error: `README not accessible (HTTP ${res.status})` },
          { status: 500 }
        );
      }
    }

    const data = await res.json();

    // GitHub README API returns base64 encoded content
    if (!data.content) {
      console.log("📝 GitHub README: No content in response for", url);
      return Response.json(
        { error: "No README content in response" },
        { status: 500 }
      );
    }

    // Decode base64 content
    const readmeContent = Buffer.from(data.content, 'base64').toString('utf-8');

    // Basic validation
    if (!readmeContent || readmeContent.trim().length < 20) {
      console.log("📝 GitHub README: Empty or too short for", url);
      return Response.json(
        { error: "README empty or too short" },
        { status: 500 }
      );
    }

    console.log("✅ GitHub README: Successfully fetched", readmeContent.length, "characters");
    return Response.json({ readme: readmeContent });

  } catch (err) {
    // Handle different types of errors gracefully
    if (err.name === 'AbortError') {
      console.log("📝 GitHub README: Timeout fetching README");
      return Response.json(
        { error: "README fetch timeout" },
        { status: 500 }
      );
    }
    
    // Log other errors as info, not errors
    console.log("📝 GitHub README: Fetch failed -", err.message);
    return Response.json(
      { error: "README fetch failed" },
      { status: 500 }
    );
  }
}