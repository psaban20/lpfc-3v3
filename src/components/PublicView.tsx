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
      <StandingsTable rows={div.standings} seedsFinal={div.seedsFinal} poolComplete={div.poolComplete} />

      <div className="section barred">
        <h2>Pool Schedule</h2>
      </div>
      <GameList games={div.pool} />

      <div className="section barred">
        <h2>Bracket</h2>
        <span className="tag">{!div.poolComplete ? "Awaiting pool play" : div.seedsFinal ? "Seeded" : "Awaiting shootout"}</span>
      </div>
      <GameList games={div.bracket} />

      <div className="section barred">
        <h2>Field Map &amp; Rules</h2>
      </div>
      <div className="card info">
        <div className="conduct-links">
          <a className="linkbtn" href="/field-map.png" target="_blank" rel="noopener noreferrer">Field Map</a>
          <a className="linkbtn" href="/rules">Tournament Rules</a>
        </div>
      </div>

      <div className="section barred">
        <h2>Seeding &amp; Tiebreakers</h2>
      </div>
      <div className="card info">
        <p className="info-lead">
          Win = 3 points &middot; Tie = 1 &middot; Loss = 0. If teams are level on points after
          pool play, seeding is decided by the steps below, in order &mdash; the first one that
          separates them settles it.
        </p>
        <ol className="tb-list">
          <li><b>Head-to-head</b> &mdash; who won the pool game between the tied teams, if they played. Used when exactly two teams are tied; with three or more level, this step is skipped.</li>
          <li><b>Goal differential</b> &mdash; goals scored minus goals allowed across all pool games.</li>
          <li><b>Fewest goals allowed</b> &mdash; the team that gave up the fewest goals across all pool games.</li>
          <li><b>Most goals scored</b> &mdash; the team that scored the most goals across all pool games.</li>
          <li><b>PK shootout</b> &mdash; three players per team alternate penalty kicks; if still level, the same three continue in sudden death until one team scores unanswered.</li>
        </ol>
      </div>

      <div className="section barred">
        <h2>Codes of Conduct</h2>
      </div>
      <div className="card info">
        <p className="notice">
          <b>Zero tolerance.</b> By attending or participating in any LaPorte FC event, everyone
          &mdash; players, coaches, parents, and spectators &mdash; agrees to abide by these Codes
          of Conduct in addition to the tournament rules. LaPorte FC enforces a zero-tolerance
          policy for Code of Conduct infractions. No warning is required before removal from the
          tournament; the posting of these codes is the warning.
        </p>
        <div className="conduct-links">
          <a className="linkbtn" href="/conduct#coach">Coach Code of Conduct</a>
          <a className="linkbtn" href="/conduct#parent">Parent &amp; Spectator Code of Conduct</a>
        </div>
      </div>

      <div className="footer">
        La Porte Vers Le Futur &middot; <a className="adminlink" href="/admin">score entry</a>
      </div>
    </div>
  );
}
