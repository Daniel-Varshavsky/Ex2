import { NextResponse } from "next/server";

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

    // Multiple API calls to get diverse AI/ML models
    const endpoints = [
      'https://huggingface.co/api/models?pipeline_tag=text-generation&sort=likes&direction=-1&limit=8',
      'https://huggingface.co/api/models?pipeline_tag=text-classification&sort=likes&direction=-1&limit=4',
      'https://huggingface.co/api/models?pipeline_tag=image-to-text&sort=likes&direction=-1&limit=4',
      'https://huggingface.co/api/models?pipeline_tag=text-to-image&sort=likes&direction=-1&limit=4',
      'https://huggingface.co/api/models?pipeline_tag=question-answering&sort=likes&direction=-1&limit=4',
      'https://huggingface.co/api/models?pipeline_tag=feature-extraction&sort=likes&direction=-1&limit=4',
    ];

    // Fetch all endpoints concurrently
    const responses = await Promise.allSettled(
      endpoints.map(async (endpoint) => {
        const response = await fetch(endpoint, {
          headers: {
            'User-Agent': 'AI-Trends-App/1.0',
          },
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        
        return response.json();
      })
    );

    // Collect all models
    const allModels = [];
    responses.forEach((response) => {
      if (response.status === 'fulfilled' && Array.isArray(response.value)) {
        allModels.push(...response.value);
      }
    });

    // Remove duplicates and filter by date
    const uniqueModels = new Map();
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    allModels.forEach((model) => {
      if (!model.id || uniqueModels.has(model.id)) return;
      
      const lastModified = model.lastModified ? new Date(model.lastModified) : new Date(0);
      if (lastModified >= sevenDaysAgo || !model.lastModified) {
        uniqueModels.set(model.id, model);
      }
    });

    // Convert to array and sort by likes
    let models = Array.from(uniqueModels.values());
    models.sort((a, b) => (b.likes || 0) - (a.likes || 0));
    models = models.slice(0, 24);

    // Transform to your app's format
    const items = models.map((model) => {
      const [owner, ...modelParts] = model.id.split('/');
      
      // Keep the README URL approach, fallback will be handled in NewsCard
      let description = `https://huggingface.co/${model.id}/raw/main/README.md`;
      
      // But if we have cardData description, use that as backup approach
      if (model.cardData?.short_description?.trim()) {
        description = model.cardData.short_description.trim();
      } else if (model.cardData?.description?.trim()) {
        description = model.cardData.description.trim();
      } else {
        // Keep README URL for summarization
        description = `https://huggingface.co/${model.id}/raw/main/README.md`;
      }
      
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

    cache = { data: items, timestamp: now };
    return Response.json(items);

  } catch (error) {
    // Only log actual unexpected errors, not access issues
    console.log('Hugging Face route error:', error);
    return Response.json([], { status: 200 });
  }
}

export async function POST(req) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json(
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
        'Accept': 'text/plain, text/markdown, */*'
      }
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      // Handle errors gracefully without console.error
      // Use console.log for debugging instead of console.error
      if (res.status === 403) {
        console.log("📝 HuggingFace README: Access forbidden for", url);
        return NextResponse.json(
          { error: "README access restricted" },
          { status: 500 }
        );
      } else if (res.status === 404) {
        console.log("📝 HuggingFace README: Not found for", url);
        return NextResponse.json(
          { error: "README not found" },
          { status: 500 }
        );
      } else if (res.status >= 500) {
        console.log("📝 HuggingFace README: Server error for", url);
        return NextResponse.json(
          { error: "HuggingFace server error" },
          { status: 500 }
        );
      } else {
        console.log("📝 HuggingFace README: HTTP error", res.status, "for", url);
        return NextResponse.json(
          { error: `README not accessible (HTTP ${res.status})` },
          { status: 500 }
        );
      }
    }

    const readme = await res.text();

    // Validate README content
    if (!readme || readme.trim().length < 20) {
      console.log("📝 HuggingFace README: Empty or too short for", url);
      return NextResponse.json(
        { error: "README empty or too short" },
        { status: 500 }
      );
    }

    console.log("✅ HuggingFace README: Successfully fetched", readme.length, "characters");
    return NextResponse.json({ readme });

  } catch (err) {
    // Handle different types of errors gracefully
    if (err.name === 'AbortError') {
      console.log("📝 HuggingFace README: Timeout fetching README");
      return NextResponse.json(
        { error: "README fetch timeout" },
        { status: 500 }
      );
    }
    
    // Log other errors as info, not errors
    console.log("📝 HuggingFace README: Fetch failed -", err.message);
    return NextResponse.json(
      { error: "README fetch failed" },
      { status: 500 }
    );
  }
}