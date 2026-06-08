"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { PresentDivision } from "@/lib/present";
import StandingsTable from "./StandingsTable";
import GameList from "./GameList";

export default function PublicView({ divisions }: { divisions: PresentDivision[] }) {
  const router = useRouter();
  const [active, setActive] = useState(divisions[0]?.id ?? "");

  // Light auto-refresh so the board stays current during the event.
  useEffect(() => {
    const t = setInterval(() => router.refresh(), 20000);
    return () => clearInterval(t);
  }, [router]);

  const div = divisions.find((d) => d.id === active) ?? divisions[0];
  if (!div) return null;

  return (
    <div className="wrap">
      <div className="tabs" role="tablist">
        {divisions.map((d) => (
          <button
            key={d.id}
            role="tab"
            aria-selected={d.id === active}
            className="tab"
            onClick={() => setActive(d.id)}
          >
            {d.name}
            <span className="field">Field {d.field}</span>
          </button>
        ))}
      </div>

      <div className="section barred">
        <h2>Standings</h2>
        <span className="tag">{!div.poolComplete ? "Pool play" : div.seedsFinal ? "Final seeds" : "Shootout to seed"}</span>
      </div>
      <StandingsTable rows={div.standings} seedsFinal={div.seedsFinal} />

      <div className="section barred">
        <h2>Pool Schedule</h2>
      </div>
      <GameList games={div.pool} />

      <div className="section barred">
        <h2>Bracket</h2>
        <span className="tag">{!div.poolComplete ? "Awaiting pool play" : div.seedsFinal ? "Seeded" : "Awaiting shootout"}</span>
      </div>
      <GameList games={div.bracket} />

      <div className="footer">
        La Porte Vers Le Futur &middot; <a className="adminlink" href="/admin">score entry</a>
      </div>
    </div>
  );
}
