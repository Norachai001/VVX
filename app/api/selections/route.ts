import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSession } from "@/lib/auth";

// GET: Fetch all registrations submitted to staff
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.role !== "staff") {
      return NextResponse.json({ error: "Forbidden: Only staff can perform this action" }, { status: 403 });
    }

    const applications = await prisma.registration.findMany({
      where: {
        submittedToStaff: true,
      },
      orderBy: {
        updatedAt: "desc",
      },
    });
      
    return NextResponse.json({ applications }, { status: 200 });
  } catch (error) {
    console.error("Error fetching selections:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// POST: Submit approved athletes to staff
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.role !== "club") {
      return NextResponse.json({ error: "Forbidden: Only club can perform this action" }, { status: 403 });
    }

    const body = await request.json();
    const { registrationIds } = body;

    if (!registrationIds || !Array.isArray(registrationIds) || registrationIds.length === 0) {
      return NextResponse.json({ error: "Invalid registration IDs" }, { status: 400 });
    }

    // In Prisma, we can update many at once
    const result = await prisma.registration.updateMany({
      where: {
        id: {
          in: registrationIds,
        },
      },
      data: {
        submittedToStaff: true,
        staffStatus: "pending",
      },
    });

    return NextResponse.json({ success: true, count: result.count }, { status: 200 });
  } catch (error) {
    console.error("Error submitting selections:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
