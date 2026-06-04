import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSession } from "@/lib/auth";
import { uploadFile } from "@/lib/storage";

// GET: Fetch registrations (either for a specific club or for the current user)
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { uid } = session;
    const { searchParams } = new URL(request.url);
    const club = searchParams.get("club");

    if (club) {
      // Fetch registrations for a specific sport/club
      const registrations = await prisma.registration.findMany({
        where: {
          sport: club,
        },
        orderBy: {
          createdAt: "desc",
        },
      });
        
      return NextResponse.json({ registrations }, { status: 200 });
    } else {
      // Fetch current user's registration
      const registrations = await prisma.registration.findMany({
        where: {
          uid: uid,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 1,
      });

      if (registrations.length === 0) {
        return NextResponse.json({ registration: null }, { status: 200 });
      }

      return NextResponse.json({ registration: registrations[0] }, { status: 200 });
    }
  } catch (error) {
    console.error("Error fetching registration(s):", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// POST: Submit a new registration
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { uid } = session;

    const formData = await request.formData();
    const sport = formData.get("sport") as string;
    const position = formData.get("position") as string;
    const experience = formData.get("experience") as string;
    const achievement = formData.get("achievement") as string;
    const note = formData.get("note") as string;

    const files = formData.getAll("files") as File[];
    const fileUrls: { name: string; url: string }[] = [];

    // Upload files
    if (files.length > 0) {
      for (const file of files) {
        if (!file.name) continue;
        
        const uploadedFile = await uploadFile(file, `registrations/${uid}`);
        fileUrls.push(uploadedFile);
      }
    }

    // Save to PostgreSQL via Prisma
    const registration = await prisma.registration.create({
      data: {
        uid,
        sport,
        position,
        experience,
        achievement,
        note,
        files: fileUrls, // Prisma will serialize this to JSON
      },
    });

    return NextResponse.json({ success: true, id: registration.id }, { status: 201 });
  } catch (error) {
    console.error("Error submitting registration:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
