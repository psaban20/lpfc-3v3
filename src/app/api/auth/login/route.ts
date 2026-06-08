import { NextResponse } from "next/server";
import { passcodeMatches, startSession } from "@/lib/auth";

export async function POST(req: Request) {
  const { passcode } = await req.json().catch(() => ({ passcode: "" }));
  if (typeof passcode !== "string" || !passcodeMatches(passcode)) {
    return NextResponse.json({ ok: false, error: "Incorrect passcode" }, { status: 401 });
  }
  await startSession();
  return NextResponse.json({ ok: true });
}
