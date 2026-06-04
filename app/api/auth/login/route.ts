import { NextRequest, NextResponse } from "next/server";
import { authenticateLDAP, createSession } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ error: "Username and password are required" }, { status: 400 });
    }

    const user = await authenticateLDAP(username, password);
    await createSession(user);

    return NextResponse.json({ success: true, role: user.role });
  } catch (error: any) {
    console.error("LDAP Login error:", error);
    return NextResponse.json({ error: error.message || "Invalid credentials" }, { status: 401 });
  }
}
