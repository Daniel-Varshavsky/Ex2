export async function POST() {
  const token = process.env.VERCEL_TOKEN;
  const projectName = process.env.VERCEL_PROJECT_NAME;
  const gitOrg = process.env.VERCEL_GIT_ORG;
  const gitRepo = process.env.VERCEL_GIT_REPO;

  if (!token || !projectName || !gitOrg || !gitRepo) {
    return Response.json(
      { error: "Missing Vercel environment variables" },
      { status: 500 }
    );
  }

  try {
    const res = await fetch("https://api.vercel.com/v13/deployments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: projectName,
        gitSource: "github",
        gitOrg,
        gitRepo,
        target: "production",
      }),
    });

    const text = await res.text();

    // Vercel sometimes returns non-JSON on error
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error(text);
    }

    if (!res.ok) {
      throw new Error(data.error?.message || "Failed to deploy");
    }

    return Response.json({ url: data.url });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}