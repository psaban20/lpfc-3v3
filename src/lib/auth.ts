import crypto from "crypto";
import { cookies } from "next/headers";

// Simple shared-passcode auth: one ADMIN_PASSCODE for everyone entering scores
// at the fields. A correct passcode mints an HMAC-signed cookie; no accounts.
// Swap for Google-Workspace sign-in later if per-person audit is ever needed.

const COOKIE = "lpfc_admin";
const SECRET = process.env.SESSION_SECRET ?? "dev-only-secret-change-me";

function sign(value: string): string {
  return crypto.createHmac("sha256", SECRET).update(value).digest("hex");
}

export function passcodeMatches(input: string): boolean {
  const expected = process.env.ADMIN_PASSCODE ?? "letmein";
  // constant-time compare
  const a = Buffer.from(input);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export async function startSession() {
  const issued = Date.now().toString();
  const token = `${issued}.${sign(issued)}`;
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12, // a tournament day
  });
}

export async function endSession() {
  (await cookies()).delete(COOKIE);
}

export async function isAuthed(): Promise<boolean> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return false;
  const [issued, mac] = token.split(".");
  if (!issued || !mac) return false;
  const expected = sign(issued);
  const a = Buffer.from(mac);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
