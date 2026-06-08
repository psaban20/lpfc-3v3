import { NextResponse } from "next/server";
import { isAuthed } from "@/lib/auth";
import { getStore } from "@/lib/db";
import { MOCK_RESULTS } from "@/lib/mock";

export async function POST() {
  if (!(await isAuthed())) {
    return NextResponse.json({ ok: false, error: "Not signed in" }, { status: 401 });
  }
  await getStore().resetAll();
  await getStore().loadMany(MOCK_RESULTS.map((m) => ({ ...m, decidedBy: m.decidedBy ?? null })));
  return NextResponse.json({ ok: true });
}
