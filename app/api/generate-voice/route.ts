import { NextResponse } from 'next/server';

const AI_BACKEND_URL = (process.env.NEXT_PUBLIC_AI_BACKEND_URL || 'http://localhost:7860').replace(/\/$/, '');
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { deductCredits } from '@/lib/db/userService';

const VOICE_COST = 600;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { workspaceId, topic, language } = body;

    if (!workspaceId) {
      return NextResponse.json({ error: 'Missing workspaceId' }, { status: 400 });
    }

    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
      await deductCredits(session.user.email, VOICE_COST);
    } catch (e: any) {
      return NextResponse.json({ error: e.message }, { status: 402 });
    }

    const response = await fetch(`${AI_BACKEND_URL}/v1/generate-voice`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        workspace_id: workspaceId,
        topic: topic || "general overview",
        language: language || "English"
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Failed to generate voice summary');
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Generate voice error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
