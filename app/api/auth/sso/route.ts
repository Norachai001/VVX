import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  // Use Microsoft Entra ID (Azure AD) as default for Universities
  const tenantId = process.env.SSO_TENANT_ID || "common";
  const clientId = process.env.SSO_CLIENT_ID;
  
  // If no clientId is set in .env, we fallback to a mock SSO callback directly for local dev testing
  if (!clientId) {
    console.warn("SSO_CLIENT_ID is not set. Redirecting to local mockup callback.");
    const baseUrl = request.nextUrl.origin;
    return NextResponse.redirect(`${baseUrl}/api/auth/callback?code=mock_sso_code_for_development`);
  }

  const redirectUri = `${request.nextUrl.origin}/api/auth/callback`;
  const authorizationUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize`;

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    redirect_uri: redirectUri,
    response_mode: "query",
    scope: "openid profile email",
    state: "sso-login-state-12345", // In production, generate a random state and store in cookie to prevent CSRF
  });

  return NextResponse.redirect(`${authorizationUrl}?${params.toString()}`);
}
