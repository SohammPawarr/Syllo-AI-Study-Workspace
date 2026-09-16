import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectMongo from '@/lib/db/mongoose';
import { Message, Workspace, User } from '@/lib/db/models';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get('workspaceId');

    if (!workspaceId) {
      return NextResponse.json({ error: "workspaceId is required" }, { status: 400 });
    }

    await connectMongo();
    
    const user = await User.findOne({ email: session.user.email });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Verify workspace belongs to user
    const ws = await Workspace.findOne({ _id: workspaceId, userId: user._id });
    if (!ws) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    const messages = await Message.find({ workspaceId, userId: user._id }).sort({ createdAt: 1 });
    
    // Map to frontend ChatMessage format
    const formattedMessages = messages.map(m => ({
      role: m.role,
      content: m.content,
      type: m.type,
      meta: m.meta,
      id: m._id.toString()
    }));

    return NextResponse.json({ messages: formattedMessages });
  } catch (error: any) {
    console.error('Fetch Messages Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { workspaceId, role, content, type, meta } = body;

    if (!workspaceId || !role) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    await connectMongo();
    const user = await User.findOne({ email: session.user.email });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const newMessage = await Message.create({
      workspaceId,
      userId: user._id,
      role,
      content: content || '',
      type,
      meta
    });

    return NextResponse.json({ success: true, message: newMessage });
  } catch (error: any) {
    console.error('Save Message Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
