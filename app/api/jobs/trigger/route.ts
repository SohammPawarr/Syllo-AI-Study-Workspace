import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { workspaceId, fileUrl } = body;

    if (!workspaceId || !fileUrl) {
      return NextResponse.json({ error: "Missing workspaceId or fileUrl" }, { status: 400 });
    }

    const fastapiUrl = (process.env.NEXT_PUBLIC_AI_BACKEND_URL || 'http://localhost:7860').replace(/\/$/, '');

    // Trigger Python backend
    const response = await fetch(`${fastapiUrl}/v1/process`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ workspace_id: workspaceId, file_url: fileUrl })
    });

    if (!response.ok) {
      throw new Error(`FastAPI responded with status: ${response.status}`);
    }

    const data = await response.json();
    
    // Returns task_id from Celery
    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to trigger job" }, { status: 500 });
  }
}
