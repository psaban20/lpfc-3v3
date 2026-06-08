import { NextResponse } from "next/server";
import { isAuthed } from "@/lib/auth";
import { getStore } from "@/lib/db";
import type { GameStatus } from "@/lib/types";

const STATUSES: GameStatus[] = ["scheduled", "final", "forfeit", "not_played"];

export async function POST(req: Request) {
  if (!(await isAuthed())) {
    return NextResponse.json({ ok: false, error: "Not signed in" }, { status: 401 });
  }
  const body = await req.json().catch(() => null);
  if (!body || typeof body.gameId !== "string" || !STATUSES.includes(body.status)) {
    return NextResponse.json({ ok: false, error: "Bad request" }, { status: 400 });
  }
  const num = (v: unknown): number | null =>
    v === null || v === "" || v === undefined ? null : Number(v);
  try {
    await getStore().saveResult(body.gameId, {
      homeScore: num(body.homeScore),
      awayScore: num(body.awayScore),
      status: body.status,
      decidedBy: body.decidedBy ?? null,
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
