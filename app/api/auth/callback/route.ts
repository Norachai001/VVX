import { NextRequest, NextResponse } from "next/server";
import { createSession } from "@/lib/auth";
import { v4 as uuidv4 } from "uuid";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(`${request.nextUrl.origin}/login?error=${error}`);
  }

  if (!code) {
    return NextResponse.redirect(`${request.nextUrl.origin}/login?error=no_code`);
  }

  try {
    const clientId = process.env.SSO_CLIENT_ID;
    let email = "";
    let name = "";

    // If no client ID, assume it's the mock code we sent from /api/auth/sso
    if (!clientId && code === "mock_sso_code_for_development") {
      email = "athlete-sso@up.ac.th";
      name = "Mock SSO User";
    } else {
      // Real SSO Token Exchange (Microsoft Entra ID)
      const tenantId = process.env.SSO_TENANT_ID || "common";
      const clientSecret = process.env.SSO_CLIENT_SECRET;
      const redirectUri = `${request.nextUrl.origin}/api/auth/callback`;
      const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;

      const body = new URLSearchParams({
        client_id: clientId!,
        scope: "openid profile email",
        code,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
        client_secret: clientSecret!,
      });

      const tokenRes = await fetch(tokenUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: body.toString(),
      });

      if (!tokenRes.ok) {
        throw new Error("Failed to exchange code for token");
      }

      const tokenData = await tokenRes.json();
      
      // Parse the ID token (JWT) to get user info
      // In production, you should verify the signature of this token!
      const idTokenParts = tokenData.id_token.split('.');
      const payload = JSON.parse(Buffer.from(idTokenParts[1], 'base64').toString());
      
      email = payload.email || payload.preferred_username;
      name = payload.name;
    }

    // Determine Role (Mockup logic based on email)
    // Normally you'd check this email against your database to get the real role
    let role: "athlete" | "club" | "staff" = "athlete";
    if (email.includes("club")) role = "club";
    if (email.includes("staff")) role = "staff";

    // Create User Payload
    const userPayload = {
      uid: `sso-${uuidv4()}`,
      username: email,
      role: role,
    };

    // Create session (sets the cookie)
    await createSession(userPayload);

    // Redirect to the appropriate dashboard
    if (role === "athlete") return NextResponse.redirect(`${request.nextUrl.origin}/athlete/register`);
    if (role === "club") return NextResponse.redirect(`${request.nextUrl.origin}/club/athletes`);
    if (role === "staff") return NextResponse.redirect(`${request.nextUrl.origin}/staff/applications`);
    
    return NextResponse.redirect(`${request.nextUrl.origin}/`);

  } catch (err: any) {
    console.error("SSO Callback Error:", err);
    return NextResponse.redirect(`${request.nextUrl.origin}/login?error=sso_failed`);
  }
}
