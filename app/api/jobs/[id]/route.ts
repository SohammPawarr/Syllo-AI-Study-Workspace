import { NextResponse, NextRequest } from 'next/server';
import dbConnect from '@/lib/db/mongoose';
import { Document } from '@/lib/db/models';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id: documentId } = await params;

    // The frontend passes the workspaceId as the 'id' parameter in the URL.
    // So 'documentId' here actually represents the workspaceId.
    const docs = await Document.find({ workspaceId: documentId });

    if (!docs || docs.length === 0) {
      return NextResponse.json({ error: "Documents not found for this workspace" }, { status: 404 });
    }

    // Aggregate statuses across all documents
    let overallPhase = 'READY';
    let errorMessage = null;

    const phases = ['PENDING', 'EXTRACTING', 'CHUNKING', 'EMBEDDING', 'READY', 'FAILED'];
    
    for (const doc of docs) {
      if (doc.processingStatus === 'FAILED') {
        overallPhase = 'FAILED';
        errorMessage = doc.errorMessage;
        break;
      }
      // If the document's phase is less progressed than the overall phase, update overall phase
      if (phases.indexOf(doc.processingStatus) < phases.indexOf(overallPhase)) {
        overallPhase = doc.processingStatus;
      }
    }

    return NextResponse.json({
      workspaceId: documentId,
      status: overallPhase === 'READY' ? 'COMPLETED' : 'PROCESSING',
      phase: overallPhase,
      result: overallPhase === 'READY' ? { ready: true } : null,
      error: errorMessage
    }, { status: 200 });
    
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch job status" }, { status: 500 });
  }
}
