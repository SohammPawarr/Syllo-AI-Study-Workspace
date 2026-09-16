import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongoose';
import { Workspace, User, Document } from '@/lib/db/models';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { deductCredits } from '@/lib/db/userService';

import Groq from 'groq-sdk';

const WORKSPACE_CREATION_COST = 1000;
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || "" });

export async function POST(req: Request) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { fileNames, title } = await req.json();

    let finalTitle = title;

    if (fileNames && fileNames.length > 0 && !finalTitle) {
      try {
        const prompt = `Generate a very short, 2-3 word topic name for a study workspace that contains the following files: ${fileNames.join(", ")}. Do not include quotes, file extensions, or extra text. Just the topic name.`;
        const result = await groq.chat.completions.create({
          model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.3,
          max_tokens: 20
        });
        finalTitle = result.choices[0]?.message?.content?.trim() || "Untitled Workspace";
      } catch (err) {
        console.error("Groq auto-name failed, falling back", err);
        finalTitle = fileNames[0].split('.')[0] || "Untitled Workspace";
      }
    } else if (!finalTitle) {
      return NextResponse.json({ error: "Missing workspace title or fileNames" }, { status: 400 });
    }

    // Charge 1000 credits for creating a workspace
    try {
      await deductCredits(session.user.email, WORKSPACE_CREATION_COST);
    } catch (e: any) {
      return NextResponse.json({ error: e.message }, { status: 402 });
    }

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Create the Workspace
    const workspace = await Workspace.create({
      userId: user._id,
      title: finalTitle,
    });

    return NextResponse.json({ 
      workspaceId: workspace._id.toString(), 
      title: workspace.title,
      status: 'created' 
    }, { status: 200 });

  } catch (error) {
    console.error("Workspace creation error:", error);
    return NextResponse.json({ error: "Workspace creation failed" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Fetch all workspaces for user
    const workspaces = await Workspace.find({ userId: user._id })
      .sort({ _id: -1 }) // Newest first
      .lean();
      
    // Fetch all documents for these workspaces
    const workspaceIds = workspaces.map((w: any) => w._id);
    const documents = await Document.find({ workspaceId: { $in: workspaceIds } }).lean();
    
    // Group documents by workspace
    const mappedWorkspaces = workspaces.map((ws: any) => {
      const wsDocs = documents.filter((d: any) => d.workspaceId.toString() === ws._id.toString());
      
      // A workspace is ready if all its documents are ready
      const allReady = wsDocs.length > 0 && wsDocs.every((d: any) => d.processingStatus === 'READY');
      const anyFailed = wsDocs.some((d: any) => d.processingStatus === 'FAILED');
      
      let status = "processing";
      if (allReady) status = "ready";
      if (anyFailed) status = "failed";
      if (wsDocs.length === 0) status = "ready"; // Empty workspace
      
      return {
        id: ws._id.toString(),
        name: ws.title || "Untitled Workspace",
        status: status,
        documents: wsDocs.map((d: any) => ({
          id: d._id.toString(),
          name: d.title,
          status: d.processingStatus === 'READY' ? 'ready' : (d.processingStatus === 'FAILED' ? 'failed' : 'processing')
        }))
      };
    });

    return NextResponse.json({ workspaces: mappedWorkspaces });
  } catch (error) {
    console.error("Error fetching workspaces:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

