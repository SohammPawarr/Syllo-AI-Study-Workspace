import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { deductCredits } from '@/lib/db/userService';
export const maxDuration = 60; // Allow up to 60s for Vercel Serverless

const COST = 250;
const BACKEND_URL = process.env.NEXT_PUBLIC_AI_BACKEND_URL || 'http://localhost:7860';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { workspaceId, topic } = await req.json();

    if (!workspaceId || !topic) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Deduct credits
    try {
      await deductCredits(session.user.email, COST);
    } catch (e: any) {
      return NextResponse.json({ error: e.message }, { status: 402 });
    }

    // Call FastAPI backend
    const backendRes = await fetch(`${BACKEND_URL.replace(/\/$/, '')}/v1/generate-studyplan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workspace_id: workspaceId, topic }),
    });

    if (!backendRes.ok) {
      const errData = await backendRes.json().catch(() => ({}));
      return NextResponse.json(
        { error: errData.detail || "Backend generation failed" },
        { status: backendRes.status }
      );
    }

    const data = await backendRes.json();
    return NextResponse.json({ study_plan: data.study_plan });

  } catch (error) {
    console.error("Study Planner Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
