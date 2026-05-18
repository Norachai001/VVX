import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb, adminStorage } from "@/lib/firebase-admin";
import * as admin from "firebase-admin";

// GET: Fetch registrations (either for a specific club or for the current user)
export async function GET(request: NextRequest) {
  try {
    const session = request.cookies.get("session")?.value;
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decodedClaims = await adminAuth.verifySessionCookie(session);
    const uid = decodedClaims.uid;
    const { searchParams } = new URL(request.url);
    const club = searchParams.get("club");

    if (club) {
      // Fetch registrations for a specific sport/club
      const snapshot = await adminDb
        .collection("registrations")
        .where("sport", "==", club)
        .orderBy("createdAt", "desc")
        .get();
        
      const registrations = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return NextResponse.json({ registrations }, { status: 200 });
    } else {
      // Fetch current user's registration
      const snapshot = await adminDb
        .collection("registrations")
        .where("uid", "==", uid)
        .orderBy("createdAt", "desc")
        .limit(1)
        .get();

      if (snapshot.empty) {
        return NextResponse.json({ registration: null }, { status: 200 });
      }

      const doc = snapshot.docs[0];
      return NextResponse.json({ registration: { id: doc.id, ...doc.data() } }, { status: 200 });
    }
  } catch (error) {
    console.error("Error fetching registration(s):", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// POST: Submit a new registration
export async function POST(request: NextRequest) {
  try {
    const session = request.cookies.get("session")?.value;
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decodedClaims = await adminAuth.verifySessionCookie(session);
    const uid = decodedClaims.uid;

    const formData = await request.formData();
    const sport = formData.get("sport") as string;
    const position = formData.get("position") as string;
    const experience = formData.get("experience") as string;
    const achievement = formData.get("achievement") as string;
    const note = formData.get("note") as string;

    const files = formData.getAll("files") as File[];
    const fileUrls: { name: string; url: string }[] = [];

    // Upload files to Firebase Storage
    if (files.length > 0) {
      const bucket = adminStorage.bucket();
      
      for (const file of files) {
        if (!file.name) continue;
        
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        
        const filename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
        const filePath = `registrations/${uid}/${filename}`;
        
        const fileRef = bucket.file(filePath);
        
        await fileRef.save(buffer, {
          metadata: {
            contentType: file.type,
          },
        });
        
        await fileRef.makePublic();
        const publicUrl = fileRef.publicUrl();
        
        fileUrls.push({
          name: file.name,
          url: publicUrl,
        });
      }
    }

    // Save to Firestore
    const registrationData = {
      uid,
      sport,
      position,
      experience,
      achievement,
      note,
      files: fileUrls,
      status: "pending",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const docRef = await adminDb.collection("registrations").add(registrationData);

    return NextResponse.json({ success: true, id: docRef.id }, { status: 201 });
  } catch (error) {
    console.error("Error submitting registration:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
