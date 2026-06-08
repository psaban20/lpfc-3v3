"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { PresentDivision, PresentGame } from "@/lib/present";
import type { GameStatus } from "@/lib/types";

function EntryRow({ g, onSaved }: { g: PresentGame; onSaved: (msg: string) => void }) {
  const ready = g.homeReady && g.awayReady;
  const [home, setHome] = useState(g.homeScore?.toString() ?? "");
  const [away, setAway] = useState(g.awayScore?.toString() ?? "");
  const [status, setStatus] = useState<GameStatus>(g.status === "scheduled" ? "final" : g.status);
  const [decidedBy, setDecidedBy] = useState<"home" | "away" | null>(g.decidedBy);
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState(false);

  const tied = status === "final" && home !== "" && away !== "" && Number(home) === Number(away);
  const needsShootout = tied && g.stage !== "pool"; // bracket games can't end level
  const missingScore = status === "final" && (home === "" || away === "");
  const hasStoredResult = g.status !== "scheduled";

  async function save() {
    setBusy(true);
    const res = await fetch("/api/results", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        gameId: g.id,
        homeScore: status === "final" ? home : null,
        awayScore: status === "final" ? away : null,
        status,
        decidedBy: status === "forfeit" || needsShootout ? decidedBy : null,
      }),
    });
    setBusy(false);
    if (res.ok) {
      setFlash(true);
      setTimeout(() => setFlash(false), 1500);
      onSaved(`${g.homeLabel} vs ${g.awayLabel} saved`);
    }
  }

  async function clear() {
    if (!confirm(`Clear the score for ${g.homeLabel} vs ${g.awayLabel}?`)) return;
    setBusy(true);
    const res = await fetch("/api/results", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gameId: g.id }),
    });
    setBusy(false);
    if (res.ok) {
      setHome("");
      setAway("");
      setStatus("final");
      setDecidedBy(null);
      onSaved(`${g.homeLabel} vs ${g.awayLabel} cleared`);
    }
  }

  if (!ready) {
    return (
      <div className="entry locked">
        <div className="who">
          {g.stage !== "pool" && <span className="stagelabel">{g.stageLabel} &middot; {g.time}</span>}
          <div>{g.homeLabel} vs {g.awayLabel}</div>
        </div>
        <div className="lockmsg">Locked until earlier games finish.</div>
      </div>
    );
  }

  return (
    <div className="entry">
      <div className="who">
        {g.stage !== "pool" && <span className="stagelabel">{g.stageLabel} &middot; {g.time}</span>}
        <div>{g.homeLabel}</div>
        <div>{g.awayLabel}</div>
        <span className="meta">Field {g.field} &middot; {g.time}</span>
      </div>
      <div className="scorebox">
        <input
          inputMode="numeric"
          aria-label={`${g.homeLabel} score`}
          value={status === "final" ? home : ""}
          disabled={status !== "final"}
          onChange={(e) => setHome(e.target.value.replace(/\D/g, ""))}
        />
        <span className="x">&ndash;</span>
        <input
          inputMode="numeric"
          aria-label={`${g.awayLabel} score`}
          value={status === "final" ? away : ""}
          disabled={status !== "final"}
          onChange={(e) => setAway(e.target.value.replace(/\D/g, ""))}
        />
      </div>

      <div className="status-row">
        {(["final", "forfeit", "not_played"] as GameStatus[]).map((s) => (
          <button key={s} className="chip" aria-pressed={status === s} onClick={() => setStatus(s)}>
            {s === "final" ? "Final" : s === "forfeit" ? "Forfeit" : "Not played"}
          </button>
        ))}
      </div>

      {(status === "forfeit" || needsShootout) && (
        <div className="status-row">
          <span style={{ fontFamily: "var(--cond)", fontSize: 13, color: "var(--muted)", alignSelf: "center" }}>
            {status === "forfeit" ? "Won by forfeit:" : "Shootout winner:"}
          </span>
          <button className="chip" aria-pressed={decidedBy === "home"} onClick={() => setDecidedBy("home")}>
            {g.homeLabel}
          </button>
          <button className="chip" aria-pressed={decidedBy === "away"} onClick={() => setDecidedBy("away")}>
            {g.awayLabel}
          </button>
        </div>
      )}

      <div className="save">
        <button
          className="btn btn-ink"
          disabled={busy || missingScore || ((status === "forfeit" || needsShootout) && !decidedBy)}
          onClick={save}
        >
          {busy ? "Saving..." : "Save"}
        </button>
        {hasStoredResult && (
          <button className="btn btn-ghost" disabled={busy} onClick={clear} style={{ marginLeft: 8 }}>
            Clear
          </button>
        )}
        {missingScore && (
          <span style={{ fontFamily: "var(--cond)", fontSize: 12.5, color: "var(--muted)", marginLeft: 8 }}>
            Enter a score in both boxes, or pick Forfeit / Not played.
          </span>
        )}
        {flash && <span className="saved-flash"> &nbsp;✓ Saved</span>}
      </div>
    </div>
  );
}

export default function AdminPanel({ divisions }: { divisions: PresentDivision[] }) {
  const router = useRouter();
  const [active, setActive] = useState(divisions[0]?.id ?? "");
  const [toast, setToast] = useState<string | null>(null);

  const div = divisions.find((d) => d.id === active) ?? divisions[0];

  function flashToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 1800);
    router.refresh();
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.refresh();
  }

  async function loadMock() {
    if (!confirm("Replace all current scores with the mock test set?")) return;
    await fetch("/api/admin/mock", { method: "POST" });
    flashToast("Mock scores loaded");
  }

  async function reset() {
    if (!confirm("Clear ALL scores and return to a clean slate?")) return;
    await fetch("/api/admin/reset", { method: "POST" });
    flashToast("All scores cleared");
  }

  if (!div) return null;

  return (
    <div className="wrap">
      <div className="admin-bar">
        <a className="btn btn-ghost" href="/">View board</a>
        <button className="btn btn-ghost" onClick={logout}>Sign out</button>
      </div>

      <div className="tabs" role="tablist">
        {divisions.map((d) => (
          <button key={d.id} role="tab" aria-selected={d.id === active} className="tab" onClick={() => setActive(d.id)}>
            {d.name}
            <span className="field">Field {d.field}</span>
          </button>
        ))}
      </div>

      <div className="section barred"><h2>Pool Games</h2></div>
      <div className="card">
        {div.pool.map((g) => <EntryRow key={g.id} g={g} onSaved={flashToast} />)}
      </div>

      <div className="section barred">
        <h2>Bracket</h2>
        <span className="tag">{div.poolComplete ? "Seeded" : "Locked until pool play ends"}</span>
      </div>
      <div className="card">
        {div.bracket.map((g) => <EntryRow key={g.id} g={g} onSaved={flashToast} />)}
      </div>

      <div className="section barred"><h2>Testing Tools</h2></div>
      <div className="card" style={{ padding: 16 }}>
        <p style={{ fontFamily: "var(--cond)", color: "var(--muted)", marginTop: 0, fontSize: 14 }}>
          Use these before the event to rehearse. Load the mock set to see standings and brackets
          fill in, then clear it before the real tournament.
        </p>
        <div className="admin-bar" style={{ margin: 0 }}>
          <button className="btn btn-red" onClick={loadMock}>Load mock scores</button>
          <button className="btn btn-ghost" onClick={reset}>Clear all scores</button>
        </div>
      </div>

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
