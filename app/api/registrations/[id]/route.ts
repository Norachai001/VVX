import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = request.cookies.get("session")?.value;
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decodedClaims = await adminAuth.verifySessionCookie(session);
    if (decodedClaims.role !== "club") {
      return NextResponse.json({ error: "Forbidden: Only club role can perform this action" }, { status: 403 });
    }

    const resolvedParams = await params;
    const { id } = resolvedParams;
    
    if (!id) {
      return NextResponse.json({ error: "Missing registration ID" }, { status: 400 });
    }

    const body = await request.json();
    const { status } = body;

    if (!["approved", "rejected", "pending"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    await adminDb.collection("registrations").doc(id).update({
      status,
      updatedAt: new Date(),
    });

    return NextResponse.json({ success: true, id, status }, { status: 200 });
  } catch (error) {
    console.error("Error updating registration:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
