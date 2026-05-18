import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ success: true }, { status: 200 });
  
  // Clear the secure cookies
  response.cookies.delete("session");
  response.cookies.delete("role");

  return response;
}
