import { NextResponse } from "next/server";
import { isAuthed } from "@/lib/auth";
import { getStore } from "@/lib/db";
import type { GameStatus } from "@/lib/types";

const STATUSES: GameStatus[] = ["scheduled", "final", "forfeit", "not_played"];

const num = (v: unknown): number | null =>
  v === null || v === "" || v === undefined ? null : Number(v);

// Save (or update) a single game result.
export async function POST(req: Request) {
  if (!(await isAuthed())) {
    return NextResponse.json({ ok: false, error: "Not signed in" }, { status: 401 });
  }
  const body = await req.json().catch(() => null);
  if (!body || typeof body.gameId !== "string" || !STATUSES.includes(body.status)) {
    return NextResponse.json({ ok: false, error: "Bad request" }, { status: 400 });
  }

  const homeScore = num(body.homeScore);
  const awayScore = num(body.awayScore);

  // A final score requires a real number in BOTH boxes -- prevents an
  // accidental blank save from registering as a played 0-0 game.
  if (body.status === "final") {
    const bad = (n: number | null) => n === null || Number.isNaN(n) || n < 0;
    if (bad(homeScore) || bad(awayScore)) {
      return NextResponse.json(
        { ok: false, error: "Enter a score in both boxes to save a final result." },
        { status: 400 },
      );
    }
  }

  try {
    await getStore().saveResult(body.gameId, {
      homeScore: body.status === "final" ? homeScore : null,
      awayScore: body.status === "final" ? awayScore : null,
      status: body.status,
      decidedBy: body.decidedBy ?? null,
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}

// Clear a single game result -- returns it to "scheduled" (unplayed). Used when
// a score was entered on the wrong game.
export async function DELETE(req: Request) {
  if (!(await isAuthed())) {
    return NextResponse.json({ ok: false, error: "Not signed in" }, { status: 401 });
  }
  const body = await req.json().catch(() => null);
  if (!body || typeof body.gameId !== "string") {
    return NextResponse.json({ ok: false, error: "Bad request" }, { status: 400 });
  }
  try {
    await getStore().clearResult(body.gameId);
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
