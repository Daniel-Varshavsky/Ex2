export async function GET(req) {
  console.log("📡 FEED ROUTE CALLED:", new Date().toISOString());
  console.log("📍 Request info:", {
    method: req.method,
    url: req.url,
    headers: {
      host: req.headers.get('host'),
      'user-agent': req.headers.get('user-agent'),
      origin: req.headers.get('origin'),
      referer: req.headers.get('referer')
    }
  });
  
  // Detect environment and construct base URL
  const host = req.headers.get('host');
  const protocol = req.headers.get('x-forwarded-proto') || 'https';
  const baseUrl = `${protocol}://${host}`;
  
  console.log("🌐 FEED: Detected base URL:", baseUrl);
  console.log("🌐 FEED: Environment vars:", {
    VERCEL: process.env.VERCEL,
    VERCEL_URL: process.env.VERCEL_URL,
    NODE_ENV: process.env.NODE_ENV
  });

  const githubUrl = `${baseUrl}/api/github`;
  const huggingfaceUrl = `${baseUrl}/api/huggingface`;
  
  console.log("🎯 FEED: Will fetch URLs:", {
    github: githubUrl,
    huggingface: huggingfaceUrl
  });

  try {
    console.log("🚀 FEED: Starting parallel API calls...");
    
    const [ghResponse, hfResponse] = await Promise.allSettled([
      fetch(githubUrl, {
        headers: {
          'User-Agent': 'AI-Trends-Feed/1.0',
          'Content-Type': 'application/json'
        }
      }).then(async (r) => {
        console.log("📡 FEED: GitHub fetch response:", r.status, r.statusText);
        if (!r.ok) {
          const errorText = await r.text();
          console.error("❌ FEED: GitHub fetch error:", errorText);
          throw new Error(`GitHub API failed: ${r.status}`);
        }
        const data = await r.json();
        console.log("✅ FEED: GitHub data received:", Array.isArray(data) ? data.length : typeof data, "items");
        return data;
      }),
      
      fetch(huggingfaceUrl, {
        headers: {
          'User-Agent': 'AI-Trends-Feed/1.0',
          'Content-Type': 'application/json'
        }
      }).then(async (r) => {
        console.log("📡 FEED: HuggingFace fetch response:", r.status, r.statusText);
        if (!r.ok) {
          const errorText = await r.text();
          console.error("❌ FEED: HuggingFace fetch error:", errorText);
          throw new Error(`HuggingFace API failed: ${r.status}`);
        }
        const data = await r.json();
        console.log("✅ FEED: HuggingFace data received:", Array.isArray(data) ? data.length : typeof data, "items");
        return data;
      })
    ]);

    // Process results
    let gh = [];
    let hf = [];

    if (ghResponse.status === 'fulfilled') {
      gh = Array.isArray(ghResponse.value) ? ghResponse.value : [];
      console.log("🎯 FEED: GitHub final count:", gh.length);
    } else {
      console.error("💥 FEED: GitHub failed:", ghResponse.reason?.message);
    }

    if (hfResponse.status === 'fulfilled') {
      hf = Array.isArray(hfResponse.value) ? hfResponse.value : [];
      console.log("🎯 FEED: HuggingFace final count:", hf.length);
    } else {
      console.error("💥 FEED: HuggingFace failed:", hfResponse.reason?.message);
    }

    const merged = [...gh, ...hf];
    console.log("🔀 FEED: Merged total:", merged.length);

    if (merged.length > 0) {
      // Sort by stars/likes primarily, then by recency
      merged.sort((a, b) => {
        if (b.stars !== a.stars) {
          return b.stars - a.stars;
        }
        return new Date(b.updated_at) - new Date(a.updated_at);
      });
      
      console.log("📊 FEED: Top item after sorting:", {
        title: merged[0]?.title,
        stars: merged[0]?.stars,
        source: merged[0]?.source
      });
    }

    console.log("✨ FEED: Returning", merged.length, "total items");
    return Response.json(merged);
    
  } catch (e) {
    console.error("💥 FEED: Route error:", e.message);
    console.error("💥 FEED: Stack:", e.stack);
    console.log("🔄 FEED: Returning empty array due to error");
    return Response.json([], { status: 200 });
  }
}