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
      // Text generation models (most popular AI category)
      'https://huggingface.co/api/models?pipeline_tag=text-generation&sort=likes&direction=-1&limit=8',
      // Text classification models
      'https://huggingface.co/api/models?pipeline_tag=text-classification&sort=likes&direction=-1&limit=4',
      // Image-text models (multimodal AI)
      'https://huggingface.co/api/models?pipeline_tag=image-to-text&sort=likes&direction=-1&limit=4',
      // Text-to-image models (generative AI)
      'https://huggingface.co/api/models?pipeline_tag=text-to-image&sort=likes&direction=-1&limit=4',
      // Question answering models
      'https://huggingface.co/api/models?pipeline_tag=question-answering&sort=likes&direction=-1&limit=4',
      // Embedding models (core ML)
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
      
      // Filter by date if lastModified exists, otherwise include all
      const lastModified = model.lastModified ? new Date(model.lastModified) : new Date(0);
      if (lastModified >= sevenDaysAgo || !model.lastModified) {
        uniqueModels.set(model.id, model);
      }
    });

    // Convert to array and sort by likes
    let models = Array.from(uniqueModels.values());
    models.sort((a, b) => (b.likes || 0) - (a.likes || 0));
    
    // Take top 24
    models = models.slice(0, 24);

    // Transform to your app's format
    const items = models.map((model) => {
      const [owner, ...modelParts] = model.id.split('/');
      
      // Enhanced description generation
      //let description = generateDescription(model);
      
      return {
        id: `hf-${model.id}`,
        source: 'huggingface',
        title: model.id,
        description: `https://huggingface.co/${model.id}/raw/main/README.md`,
        url: `https://huggingface.co/${model.id}`,
        stars: model.likes || 0,
        language: model.pipeline_tag || (model.library && model.library[0]) || '',
        owner: owner || '',
        avatar: null, // HF doesn't provide consistent avatar URLs
        updated_at: model.lastModified || model.createdAt || new Date().toISOString(),
      };
    });

    cache = { data: items, timestamp: now };
    return Response.json(items);

  } catch (error) {
    console.error('Hugging Face route error:', error);
    // Return empty array on error to prevent breaking the app
    return Response.json([], { status: 200 });
  }
}

// Helper function to generate better descriptions
function generateDescription(model) {
  // Try to get description from various sources
  let description = '';
  
  // Priority order for description sources
  if (model.cardData?.short_description?.trim()) {
    description = model.cardData.short_description.trim();
  } else if (model.cardData?.description?.trim()) {
    description = model.cardData.description.trim();
  } else if (model.cardData?.summary?.trim()) {
    description = model.cardData.summary.trim();
  } else if (model.description?.trim()) {
    description = model.description.trim();
  }
  
  // If no description found, generate one from pipeline_tag
  if (!description) {
    description = generatePipelineDescription(model.pipeline_tag, model);
  }
  
  // Clean up the description
  description = cleanDescription(description);
  
  // Fallback
  if (!description || description.length < 10) {
    description = `Hugging Face ${model.pipeline_tag || 'AI'} model for machine learning applications.`;
  }
  
  return description;
}

function generatePipelineDescription(pipelineTag, model) {
  const descriptions = {
    'text-generation': 'Advanced language model capable of generating human-like text for various applications including chatbots, content creation, and code generation.',
    'text-classification': 'Machine learning model designed to categorize and classify text into predefined categories for sentiment analysis, topic classification, and more.',
    'image-classification': 'Computer vision model that can identify and classify objects, scenes, and concepts within images.',
    'translation': 'Neural translation model that converts text from one language to another with high accuracy.',
    'question-answering': 'AI model specialized in understanding questions and providing accurate answers based on given context.',
    'summarization': 'Text summarization model that creates concise, coherent summaries of longer documents.',
    'token-classification': 'Named entity recognition model that identifies and classifies specific entities in text such as names, locations, and organizations.',
    'fill-mask': 'Masked language model that predicts missing words in sentences, useful for text completion and understanding.',
    'feature-extraction': 'Embedding model that converts text into numerical vectors for semantic search, similarity matching, and clustering.',
    'text-to-image': 'Generative AI model that creates images from text descriptions using advanced diffusion techniques.',
    'image-to-text': 'Vision-language model that generates descriptive captions and text from images.',
    'automatic-speech-recognition': 'Speech-to-text model that converts spoken audio into written text with high accuracy.',
    'text-to-speech': 'Voice synthesis model that converts written text into natural-sounding speech.',
    'audio-classification': 'Audio analysis model that classifies and categorizes different types of sounds and audio content.',
    'object-detection': 'Computer vision model that identifies and locates multiple objects within images.',
    'image-segmentation': 'Advanced vision model that performs pixel-level classification and segmentation of images.',
    'conversational': 'Dialogue model optimized for natural, engaging conversations and chat applications.',
    'unconditional-image-generation': 'Creative AI model that generates original images without specific prompts.',
    'sentence-similarity': 'Semantic model that measures and compares the similarity between different sentences and texts.',
  };

  return descriptions[pipelineTag] || `Specialized ${pipelineTag} model for AI and machine learning applications.`;
}

function cleanDescription(description) {
  if (!description) return '';
  
  // Remove markdown formatting
  description = description.replace(/[#*`]/g, '');
  
  // Remove excessive whitespace and newlines
  description = description.replace(/\s+/g, ' ').trim();
  
  // Remove common prefixes
  description = description.replace(/^(This model|This is|Model for|A model)/i, '');
  
  // Ensure it starts with capital letter
  if (description.length > 0) {
    description = description.charAt(0).toUpperCase() + description.slice(1);
  }
  
  // Truncate if too long
  if (description.length > 200) {
    description = description.substring(0, 200).trim();
    // Try to end at a sentence boundary
    const lastPeriod = description.lastIndexOf('.');
    const lastSpace = description.lastIndexOf(' ');
    if (lastPeriod > 150) {
      description = description.substring(0, lastPeriod + 1);
    } else if (lastSpace > 150) {
      description = description.substring(0, lastSpace) + '...';
    } else {
      description += '...';
    }
  }
  
  // Ensure it ends with punctuation
  if (description && !description.match(/[.!?]$/)) {
    description += '.';
  }
  
  return description;
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

    const res = await fetch(url);

    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to fetch README" },
        { status: res.status }
      );
    }

    const readme = await res.text();

    return NextResponse.json({ readme });
  } catch (err) {
    console.error("HuggingFace README fetch error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}