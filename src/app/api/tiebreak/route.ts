import { NextResponse } from "next/server";
import { isAuthed } from "@/lib/auth";
import { getStore } from "@/lib/db";

// Record the PK-shootout finishing order for a tied group, or clear a
// division's recorded shootouts. order = teamIds, best seed first.
export async function POST(req: Request) {
  if (!(await isAuthed())) {
    return NextResponse.json({ ok: false, error: "Not signed in" }, { status: 401 });
  }
  const body = await req.json().catch(() => null);
  const order = body?.order;
  if (
    !body ||
    typeof body.divisionId !== "string" ||
    !Array.isArray(order) ||
    order.length < 2 ||
    !order.every((id: unknown) => typeof id === "string")
  ) {
    return NextResponse.json({ ok: false, error: "Bad request" }, { status: 400 });
  }
  try {
    await getStore().saveTiebreak(body.divisionId, order as string[]);
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  if (!(await isAuthed())) {
    return NextResponse.json({ ok: false, error: "Not signed in" }, { status: 401 });
  }
  const body = await req.json().catch(() => null);
  if (!body || typeof body.divisionId !== "string") {
    return NextResponse.json({ ok: false, error: "Bad request" }, { status: 400 });
  }
  await getStore().clearTiebreaksForDivision(body.divisionId);
  return NextResponse.json({ ok: true });
}
