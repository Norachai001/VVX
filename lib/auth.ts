import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import ldap from "ldapjs";

const SECRET_KEY = new TextEncoder().encode(
  process.env.JWT_SECRET || "fallback_super_secret_key_for_development_only_12345"
);

export type UserPayload = {
  uid: string;
  role: "athlete" | "club" | "staff";
  username: string;
};

export async function createSession(payload: UserPayload) {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(SECRET_KEY);

  const cookieStore = await cookies();
  cookieStore.set("session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60, // 7 days
  });
}

export async function verifySession(token: string): Promise<UserPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    return payload as UserPayload;
  } catch (error) {
    return null;
  }
}

export async function getSession(): Promise<UserPayload | null> {
  const cookieStore = await cookies();
  const session = cookieStore.get("session")?.value;
  if (!session) return null;
  return verifySession(session);
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete("session");
}

export async function authenticateLDAP(username: string, password: string): Promise<UserPayload> {
  return new Promise((resolve, reject) => {
    // For mockup purposes, if no LDAP server is provided, we simulate a successful login
    // In a real environment, you must provide LDAP_URL and LDAP_BASE_DN in .env
    const ldapUrl = process.env.LDAP_URL;

    if (!ldapUrl) {
      console.warn("LDAP_URL is not set. Using Mockup LDAP authentication.");

      // ===== บัญชีทดสอบ (Test Accounts) =====
      const testAccounts: Record<string, { password: string; role: "athlete" | "club" | "staff" }> = {
        "athlete@up.ac.th": { password: "123456", role: "athlete" },
        "club@up.ac.th": { password: "123456", role: "club" },
        "staff@up.ac.th": { password: "123456", role: "staff" },
      };

      const account = testAccounts[username];

      // ตรวจสอบบัญชีทดสอบก่อน
      if (account && password === account.password) {
        return resolve({
          uid: `ldap-mock-${username}`,
          username: username,
          role: account.role,
        });
      }

      // Fallback: username อะไรก็ได้ + password = "password"
      if (password === "password") {
        let role: "athlete" | "club" | "staff" = "athlete";
        if (username.includes("club")) role = "club";
        if (username.includes("staff")) role = "staff";

        return resolve({
          uid: `ldap-mock-${username}`,
          username: username,
          role: role,
        });
      }

      return reject(new Error("Invalid credentials"));
    }

    const client = ldap.createClient({ url: ldapUrl });
    const bindDn = `${username}@${process.env.LDAP_DOMAIN || 'domain.local'}`; // Common AD bind format

    client.bind(bindDn, password, (err) => {
      if (err) {
        client.unbind();
        return reject(new Error("Invalid LDAP credentials"));
      }

      // Successfully authenticated
      // Role would normally be fetched via LDAP group search here
      client.unbind();
      resolve({
        uid: `ldap-${username}`,
        username: username,
        role: "athlete", // Default role
      });
    });
  });
}
