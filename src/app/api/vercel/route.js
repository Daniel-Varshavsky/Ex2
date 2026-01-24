export async function POST(req) {
  try {
    const deployHookUrl = process.env.VERCEL_DEPLOY_HOOK;
    
    if (!deployHookUrl) {
      return Response.json({ 
        error: "Deploy hook not configured. Please set VERCEL_DEPLOY_HOOK environment variable." 
      }, { status: 500 });
    }

    console.log("Triggering deployment via hook...");

    // Trigger deployment via webhook
    const response = await fetch(deployHookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        trigger: 'manual-button',
        timestamp: new Date().toISOString()
      })
    });

    console.log("Deploy hook response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Deploy hook error:", errorText);
      throw new Error(`Deploy hook failed with status: ${response.status}`);
    }

    // Try to parse response, but don't fail if it's not JSON
    let data = {};
    try {
      const responseText = await response.text();
      console.log("Deploy hook response body:", responseText);
      
      if (responseText.trim()) {
        data = JSON.parse(responseText);
      }
    } catch (parseError) {
      console.log("Response is not JSON, that's okay for deploy hooks");
    }

    // Extract project name from deploy hook URL for better messaging
    const projectMatch = deployHookUrl.match(/\/deploy\/([^\/]+)/);
    const projectHint = projectMatch ? projectMatch[1].substring(0, 8) : 'your-project';

    return Response.json({ 
      success: true,
      message: "Deployment triggered successfully!",
      // Provide a more helpful message since we don't get the exact URL immediately
      info: "Check your Vercel dashboard for deployment progress",
      projectHint: projectHint,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Deployment error:', error);
    
    return Response.json({ 
      error: error.message || "Deployment failed" 
    }, { status: 500 });
  }
}