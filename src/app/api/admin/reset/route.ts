import { NextResponse } from "next/server";
import { isAuthed } from "@/lib/auth";
import { getStore } from "@/lib/db";

export async function POST() {
  if (!(await isAuthed())) {
    return NextResponse.json({ ok: false, error: "Not signed in" }, { status: 401 });
  }
  await getStore().resetAll();
  return NextResponse.json({ ok: true });
}
