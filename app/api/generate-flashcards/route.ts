import { NextResponse } from 'next/server';

const BACKEND_URL = (process.env.NEXT_PUBLIC_AI_BACKEND_URL || 'http://localhost:7860').replace(/\/$/, '');
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { deductCredits } from '@/lib/db/userService';

const FLASHCARD_COST = 200;

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
      await deductCredits(session.user.email, FLASHCARD_COST);
    } catch (e: any) {
      return NextResponse.json({ error: e.message }, { status: 402 });
    }

    const backendBody = {
      ...body,
      workspace_id: body.workspaceId,
    };

    const response = await fetch(`${BACKEND_URL}/v1/generate-flashcards`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(backendBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Failed to generate flashcards');
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Generate Flashcards Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
