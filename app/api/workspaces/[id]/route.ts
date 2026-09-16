import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongoose';
import { Workspace, Document, DocumentChunk, Message, Quiz } from '@/lib/db/models';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// Rename workspace
export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { title } = await req.json();
    if (!title) {
      return NextResponse.json({ error: "Missing title" }, { status: 400 });
    }

    const { id } = await context.params;
    const workspace = await Workspace.findByIdAndUpdate(id, { title }, { new: true });
    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    return NextResponse.json({ status: "success", workspace });
  } catch (error) {
    console.error("Error renaming workspace:", error);
    return NextResponse.json({ error: "Failed to rename workspace" }, { status: 500 });
  }
}

// Delete workspace
export async function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: workspaceId } = await context.params;

    // Delete the workspace and all its cascading data
    await Workspace.findByIdAndDelete(workspaceId);
    await Document.deleteMany({ workspaceId });
    await DocumentChunk.deleteMany({ workspaceId });
    await Message.deleteMany({ workspaceId });
    await Quiz.deleteMany({ workspaceId });

    return NextResponse.json({ status: "success" });
  } catch (error) {
    console.error("Error deleting workspace:", error);
    return NextResponse.json({ error: "Failed to delete workspace" }, { status: 500 });
  }
}
