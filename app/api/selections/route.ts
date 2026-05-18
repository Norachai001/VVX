import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import * as admin from "firebase-admin";

// GET: Fetch all registrations submitted to staff
export async function GET(request: NextRequest) {
  try {
    const session = request.cookies.get("session")?.value;
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decodedClaims = await adminAuth.verifySessionCookie(session);
    if (decodedClaims.role !== "staff") {
      return NextResponse.json({ error: "Forbidden: Only staff can perform this action" }, { status: 403 });
    }

    const snapshot = await adminDb
      .collection("registrations")
      .where("submittedToStaff", "==", true)
      .orderBy("updatedAt", "desc")
      .get();
      
    const applications = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    return NextResponse.json({ applications }, { status: 200 });
  } catch (error) {
    console.error("Error fetching selections:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// POST: Submit approved athletes to staff
export async function POST(request: NextRequest) {
  try {
    const session = request.cookies.get("session")?.value;
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decodedClaims = await adminAuth.verifySessionCookie(session);
    if (decodedClaims.role !== "club") {
      return NextResponse.json({ error: "Forbidden: Only club can perform this action" }, { status: 403 });
    }

    const body = await request.json();
    const { registrationIds } = body;

    if (!registrationIds || !Array.isArray(registrationIds) || registrationIds.length === 0) {
      return NextResponse.json({ error: "Invalid registration IDs" }, { status: 400 });
    }

    const batch = adminDb.batch();
    
    registrationIds.forEach(id => {
      const ref = adminDb.collection("registrations").doc(id);
      batch.update(ref, {
        submittedToStaff: true,
        staffStatus: "pending",
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });

    await batch.commit();

    return NextResponse.json({ success: true, count: registrationIds.length }, { status: 200 });
  } catch (error) {
    console.error("Error submitting selections:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
