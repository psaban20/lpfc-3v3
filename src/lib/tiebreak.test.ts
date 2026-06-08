import { describe, it, expect } from "vitest";
import type { Team, Game } from "./types";
import { computeStandings } from "./standings";
import { resolveBracket } from "./bracket";

function team(id: string): Team {
  return { id, divisionId: "d", name: id };
}
let n = 0;
function pool(h: string, hs: number, a: string, as: number): Game {
  return {
    id: `g${n++}`,
    divisionId: "d",
    stage: "pool",
    time: "10:00",
    field: 1,
    home: { kind: "team", teamId: h },
    away: { kind: "team", teamId: a },
    homeScore: hs,
    awayScore: as,
    status: "final",
  };
}

describe("PK shootout seeding tiebreak", () => {
  // A and B drew head-to-head and are identical on every metric -> deadlock.
  const teams = ["A", "B"].map(team);
  const games = [pool("A", 1, "B", 1)];

  it("flags both teams and tags one tie group when unresolved", () => {
    const rows = computeStandings(teams, games);
    expect(rows.every((r) => r.needsShootout)).toBe(true);
    expect(rows[0].tieGroup).not.toBeNull();
    expect(rows[0].tieGroup).toBe(rows[1].tieGroup);
  });

  it("orders by the recorded shootout result and clears the flag", () => {
    const rows = computeStandings(teams, games, [{ divisionId: "d", order: ["B", "A"] }]);
    expect(rows.map((r) => r.team.id)).toEqual(["B", "A"]);
    expect(rows.every((r) => !r.needsShootout)).toBe(true);
    expect(rows.every((r) => r.tieGroup === null)).toBe(true);
  });

  it("ignores a tiebreak recorded for a different set of teams", () => {
    const rows = computeStandings(teams, games, [{ divisionId: "d", order: ["A", "C"] }]);
    expect(rows.every((r) => r.needsShootout)).toBe(true);
  });

  it("resolves only the still-tied pair in a 3-way tie (GD splits one off first)", () => {
    // X, Y, Z tie on points; X has best GD and takes #1 outright; Y and Z are
    // level and drew head-to-head, so only {Y,Z} need the shootout.
    n = 0;
    const t3 = ["X", "Y", "Z", "F1", "F2"].map(team);
    const g3 = [
      pool("X", 5, "F1", 1), // X: 3 pts, +4
      pool("Y", 2, "Z", 2), // Y vs Z drew
      pool("Y", 1, "F2", 0), // Y: 3 pts total, GD +1
      pool("Z", 1, "F1", 0), // Z: 3 pts total, GD +1
    ];
    // F2 and F1 lose -> 0 pts. X #1. Y & Z tied (3 pts, +1) and drew -> shootout.
    const flagged = computeStandings(t3, g3).filter((r) => r.needsShootout).map((r) => r.team.id).sort();
    expect(flagged).toEqual(["Y", "Z"]);
    const resolved = computeStandings(t3, g3, [{ divisionId: "d", order: ["Z", "Y"] }]);
    const order = resolved.map((r) => r.team.id);
    expect(order.indexOf("Z")).toBeLessThan(order.indexOf("Y"));
    expect(resolved.every((r) => !r.needsShootout)).toBe(true);
  });
});


describe("bracket gating on an unresolved tie", () => {
  n = 0;
  const teams = ["A", "B"].map(team);
  const base: Game[] = [
    pool("A", 1, "B", 1), // drew -> deadlocked seeds
    {
      id: "F",
      divisionId: "d",
      stage: "final",
      time: "14:30",
      field: 1,
      home: { kind: "seed", seed: 1 },
      away: { kind: "seed", seed: 2 },
      homeScore: null,
      awayScore: null,
      status: "scheduled",
    },
  ];

  it("leaves bracket seed slots empty while the tie is unresolved", () => {
    const rb = resolveBracket(teams, base);
    const f = rb.find((r) => r.game.id === "F")!;
    expect(f.home.team).toBeNull();
    expect(f.away.team).toBeNull();
    expect(f.home.label).toBe("Seed 1");
  });

  it("populates seed slots once the shootout is recorded", () => {
    const rb = resolveBracket(teams, base, [{ divisionId: "d", order: ["B", "A"] }]);
    const f = rb.find((r) => r.game.id === "F")!;
    expect(f.home.team?.id).toBe("B");
    expect(f.away.team?.id).toBe("A");
  });
});
