import type { PresentStanding } from "@/lib/present";

export default function StandingsTable({
  rows,
  seedsFinal,
  poolComplete,
}: {
  rows: PresentStanding[];
  seedsFinal: boolean;
  poolComplete: boolean;
}) {
  const anyShootout = rows.some((r) => r.needsShootout);
  return (
    <div className="card">
      <table className="standings">
        <thead>
          <tr>
            <th>#</th>
            <th className="lf">Team</th>
            <th>P</th>
            <th>W</th>
            <th>D</th>
            <th>L</th>
            <th>GF</th>
            <th>GA</th>
            <th>GD</th>
            <th>Pts</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr
              key={r.teamId}
              className={`seed-${r.seed} ${seedsFinal && r.seed <= 4 ? "pos-strong" : ""} ${r.played === 0 ? "muted-row" : ""}`}
            >
              <td>
                <span className="seedbadge">{r.seed}</span>
              </td>
              <td className="lf team">
                {r.name}
                {r.coach ? <span className="coach">{r.coach}</span> : null}
              </td>
              <td>{r.played}</td>
              <td>{r.wins}</td>
              <td>{r.draws}</td>
              <td>{r.losses}</td>
              <td>{r.goalsFor}</td>
              <td>{r.goalsAgainst}</td>
              <td>{r.goalDiff > 0 ? `+${r.goalDiff}` : r.goalDiff}</td>
              <td className="pts">{r.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {poolComplete && anyShootout && (
        <div className="shootout-note">
          Teams level after all tiebreakers &mdash; a PK shootout decides the seed.
        </div>
      )}
    </div>
  );
}
