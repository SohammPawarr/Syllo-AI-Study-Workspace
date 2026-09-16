import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongoose';
import { Document, Workspace } from '@/lib/db/models';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function POST(req: Request) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { fileName, fileUri, workspaceId } = await req.json();

    if (!fileName || !fileUri || !workspaceId) {
      return NextResponse.json({ error: "Missing file details or workspaceId" }, { status: 400 });
    }

    // Verify workspace exists
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    // Create tracking document in MongoDB linked to Workspace
    const doc = await Document.create({
      workspaceId: workspace._id,
      title: fileName,
      fileUrl: fileUri,
      processingStatus: 'PENDING'
    });

    return NextResponse.json({ 
      fileUri, 
      documentId: doc._id.toString(), 
      workspaceId: workspace._id.toString(),
      status: 'uploaded' 
    }, { status: 200 });

  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
