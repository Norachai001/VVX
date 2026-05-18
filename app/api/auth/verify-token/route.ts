import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";

export async function POST(request: NextRequest) {
  try {
    const { idToken } = await request.json();

    if (!idToken) {
      return NextResponse.json({ error: "No token provided" }, { status: 400 });
    }

    // Verify token
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    
    // Create session cookie (expires in 5 days)
    const expiresIn = 60 * 60 * 24 * 5 * 1000;
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });

    // Extract role from custom claims
    const role = decodedToken.role || "user";

    const response = NextResponse.json({ success: true, role }, { status: 200 });

    // Set HttpOnly secure cookies for both session and role
    const cookieOptions = {
      maxAge: expiresIn / 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      sameSite: "lax" as const,
    };

    response.cookies.set("session", sessionCookie, cookieOptions);
    response.cookies.set("role", role, cookieOptions);

    return response;
  } catch (error) {
    console.error("Error verifying token:", error);
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }
}
