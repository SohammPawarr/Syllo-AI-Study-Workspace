import { NextResponse } from 'next/server';

const AI_BACKEND_URL = (process.env.NEXT_PUBLIC_AI_BACKEND_URL || 'http://localhost:7860').replace(/\/$/, '');
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { deductCredits } from '@/lib/db/userService';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { workspaceId, messages } = body;

    if (!workspaceId || !messages) {
      return NextResponse.json({ error: 'Missing workspaceId or messages' }, { status: 400 });
    }

    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const lastMessage = messages[messages.length - 1]?.content?.toLowerCase() || '';
    let cost = 50; // default chat cost
    
    if (lastMessage.includes('#voice')) cost = 600;
    else if (lastMessage.includes('#mindmap')) cost = 500;
    else if (lastMessage.includes('#report')) cost = 400;
    else if (lastMessage.includes('#quiz')) cost = 300;
    else if (lastMessage.includes('#flashcards')) cost = 200;
    else if (lastMessage.includes('#summary')) cost = 100;

    try {
      await deductCredits(session.user.email, cost);
    } catch (e: any) {
      return NextResponse.json({ error: e.message }, { status: 402 });
    }

    const response = await fetch(`${AI_BACKEND_URL}/v1/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        workspace_id: workspaceId,
        messages: messages,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Failed to generate chat response');
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Chat error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
