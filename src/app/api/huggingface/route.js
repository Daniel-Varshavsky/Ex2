import { NextResponse } from "next/server";

let cache = {
  data: null,
  timestamp: 0,
};

const TTL = 5 * 60 * 1000; // 5 minutes

export async function GET() {
  console.log("🤗 HUGGINGFACE ROUTE CALLED:", new Date().toISOString());
  console.log("📍 Environment:", {
    NODE_ENV: process.env.NODE_ENV,
    VERCEL: process.env.VERCEL,
    VERCEL_URL: process.env.VERCEL_URL
  });
  
  try {
    const now = Date.now();

    // Check cache
    if (cache.data && now - cache.timestamp < TTL) {
      console.log("✅ HUGGINGFACE: Using cached data, items:", cache.data.length);
      return Response.json(cache.data);
    }
    console.log("🔄 HUGGINGFACE: Cache miss, fetching fresh data");

    // Multiple API calls to get diverse AI/ML models
    const endpoints = [
      'https://huggingface.co/api/models?pipeline_tag=text-generation&sort=likes&direction=-1&limit=8',
      'https://huggingface.co/api/models?pipeline_tag=text-classification&sort=likes&direction=-1&limit=4',
      'https://huggingface.co/api/models?pipeline_tag=image-to-text&sort=likes&direction=-1&limit=4',
    ];

    console.log("🌐 HUGGINGFACE: Fetching", endpoints.length, "endpoints");

    // Fetch all endpoints concurrently
    const responses = await Promise.allSettled(
      endpoints.map(async (endpoint, index) => {
        console.log(`🔗 HF Endpoint ${index + 1}:`, endpoint);
        
        const response = await fetch(endpoint, {
          headers: {
            'User-Agent': 'AI-Trends-App/1.0',
          },
        });
        
        console.log(`📡 HF Endpoint ${index + 1} status:`, response.status, response.statusText);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log(`📊 HF Endpoint ${index + 1} returned:`, data.length, "models");
        return data;
      })
    );

    // Collect all models
    const allModels = [];
    responses.forEach((response, index) => {
      if (response.status === 'fulfilled' && Array.isArray(response.value)) {
        console.log(`✅ HF Endpoint ${index + 1}: Added ${response.value.length} models`);
        allModels.push(...response.value);
      } else {
        console.error(`❌ HF Endpoint ${index + 1} failed:`, response.reason?.message);
      }
    });

    console.log("📦 HUGGINGFACE: Total models collected:", allModels.length);

    // Remove duplicates and filter by date
    const uniqueModels = new Map();
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    allModels.forEach((model) => {
      if (!model.id || uniqueModels.has(model.id)) return;
      
      // Filter by date if lastModified exists, otherwise include all
      const lastModified = model.lastModified ? new Date(model.lastModified) : new Date(0);
      if (lastModified >= sevenDaysAgo || !model.lastModified) {
        uniqueModels.set(model.id, model);
      }
    });

    // Convert to array and sort by likes
    let models = Array.from(uniqueModels.values());
    console.log("🔍 HUGGINGFACE: Unique models after filtering:", models.length);
    
    models.sort((a, b) => (b.likes || 0) - (a.likes || 0));
    
    // Take top 24
    models = models.slice(0, 24);
    console.log("🎯 HUGGINGFACE: Top models selected:", models.length);

    // Transform to your app's format
    const items = models.map((model) => {
      const [owner, ...modelParts] = model.id.split('/');
      
      let description = `https://huggingface.co/${model.id}/raw/main/README.md`;
      
      return {
        id: `hf-${model.id}`,
        source: 'huggingface',
        title: model.id,
        description,
        url: `https://huggingface.co/${model.id}`,
        stars: model.likes || 0,
        language: model.pipeline_tag || (model.library && model.library[0]) || '',
        owner: owner || '',
        avatar: null,
        updated_at: model.lastModified || model.createdAt || new Date().toISOString(),
      };
    });

    console.log("✨ HUGGINGFACE: Processed items:", items.length);
    if (items.length > 0) {
      console.log("📝 HUGGINGFACE: First item:", {
        title: items[0].title,
        stars: items[0].stars,
        language: items[0].language
      });
    }

    cache = { data: items, timestamp: now };
    console.log("💾 HUGGINGFACE: Cached", items.length, "items");
    
    return Response.json(items);

  } catch (error) {
    console.error('💥 HUGGINGFACE: Route error:', error.message);
    console.error('💥 HUGGINGFACE: Stack:', error.stack);
    // Return empty array on error to prevent breaking the app
    return Response.json([], { status: 200 });
  }
}

export async function POST(req) {
  console.log("🤗 HUGGINGFACE POST ROUTE CALLED:", new Date().toISOString());
  
  try {
    const { url } = await req.json();
    console.log("📖 HF README: Fetching URL:", url);

    if (!url) {
      console.error("❌ HF README: No URL provided");
      return NextResponse.json(
        { error: "URL is required" },
        { status: 400 }
      );
    }

    const res = await fetch(url);
    console.log("📡 HF README: Response status:", res.status, res.statusText);

    if (!res.ok) {
      console.error("❌ HF README: Fetch failed:", res.status);
      return NextResponse.json(
        { error: "Failed to fetch README" },
        { status: res.status }
      );
    }

    const readme = await res.text();
    console.log("📄 HF README: Fetched", readme.length, "characters");

    return NextResponse.json({ readme });
  } catch (err) {
    console.error("💥 HF README: Error:", err.message);
    console.error("💥 HF README: Stack:", err.stack);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}