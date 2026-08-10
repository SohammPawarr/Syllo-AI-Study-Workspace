import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import dbConnect from "@/lib/db/mongoose";
import { Document, User, DocumentChunk, Message } from "@/lib/db/models";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(req: NextRequest) {
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

    let documents = await Document.find({ userId: user._id })
      .sort({ _id: -1 }) // Newest first
      .select("title processingStatus _id");

    // Auto-delete stuck documents (FAILED or processing for > 15 mins)
    const now = Date.now();
    const fifteenMinutes = 15 * 60 * 1000;
    
    const stuckDocs = documents.filter((doc) => {
      if (doc.processingStatus === "READY") return false;
      if (doc.processingStatus === "FAILED") return true;
      
      const docTime = new Date(parseInt(doc._id.toString().substring(0, 8), 16) * 1000).getTime();
      return (now - docTime) > fifteenMinutes;
    });

    if (stuckDocs.length > 0) {
      const stuckIds = stuckDocs.map(d => d._id);
      await Document.deleteMany({ _id: { $in: stuckIds } });
      await DocumentChunk.deleteMany({ documentId: { $in: stuckIds } });
      await Message.deleteMany({ documentId: { $in: stuckIds } });
      
      documents = documents.filter((doc) => !stuckDocs.includes(doc));
    }

    const mappedDocs = documents.map((doc) => ({
      id: doc._id.toString(),
      name: doc.title || "Untitled Document",
      status: doc.processingStatus === "READY" ? "ready" : "processing",
    }));

    return NextResponse.json({ documents: mappedDocs });
  } catch (error) {
    console.error("Error fetching documents:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
