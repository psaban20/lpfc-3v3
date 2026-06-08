import { describe, it, expect } from "vitest";
import type { Team, Game, GameStatus } from "./types";
import { computeStandings, poolComplete } from "./standings";
import { resolveBracket } from "./bracket";

// --- tiny builders ---------------------------------------------------------

function mkTeam(id: string): Team {
  return { id, divisionId: "test", name: id };
}

let gameCounter = 0;
function pool(
  home: string,
  hs: number | null,
  away: string,
  as: number | null,
  status: GameStatus = "final",
  decidedBy?: "home" | "away" | null,
): Game {
  return {
    id: `g${gameCounter++}`,
    divisionId: "test",
    stage: "pool",
    time: "10:00",
    field: 1,
    home: { kind: "team", teamId: home },
    away: { kind: "team", teamId: away },
    homeScore: hs,
    awayScore: as,
    status,
    decidedBy,
  };
}

const order = (rows: { team: Team }[]) => rows.map((r) => r.team.id);

// --- regression: last year's 4/5 division ----------------------------------

describe("2025 4/5 division regression", () => {
  const teams = ["Krakens", "Cobras", "ADIG", "MCDoors", "Palmeiras", "Goats", "Bananas"].map(mkTeam);
  const games: Game[] = [
    pool("ADIG", 5, "Goats", 4),
    pool("Krakens", 4, "MCDoors", 0),
    pool("Bananas", 1, "Palmeiras", 1),
    pool("Cobras", 2, "ADIG", 1),
    pool("Krakens", 5, "Palmeiras", 5),
    pool("MCDoors", 4, "Bananas", 2),
    pool("Goats", 4, "Cobras", 4),
  ];

  it("reproduces the published seed order", () => {
    const rows = computeStandings(teams, games);
    expect(order(rows)).toEqual([
      "Krakens", "Cobras", "ADIG", "MCDoors", "Palmeiras", "Goats", "Bananas",
    ]);
  });

  it("computes the right points and goal differential", () => {
    const rows = computeStandings(teams, games);
    const krakens = rows.find((r) => r.team.id === "Krakens")!;
    expect(krakens.points).toBe(4);
    expect(krakens.goalsFor).toBe(9);
    expect(krakens.goalsAgainst).toBe(5);
    expect(krakens.goalDiff).toBe(4);
  });
});

// --- forfeit and not-played special scoring --------------------------------

describe("special results", () => {
  it("records a forfeit as 4-0 for the present team", () => {
    const teams = ["A", "B"].map(mkTeam);
    const rows = computeStandings(teams, [pool("A", null, "B", null, "forfeit", "home")]);
    const a = rows.find((r) => r.team.id === "A")!;
    expect(a.goalsFor).toBe(4);
    expect(a.goalsAgainst).toBe(0);
    expect(a.wins).toBe(1);
    expect(a.points).toBe(3);
  });

  it("records an unplayed game as a 0-0 tie", () => {
    const teams = ["A", "B"].map(mkTeam);
    const rows = computeStandings(teams, [pool("A", null, "B", null, "not_played")]);
    for (const r of rows) {
      expect(r.points).toBe(1);
      expect(r.goalsFor).toBe(0);
      expect(r.draws).toBe(1);
    }
  });
});

// --- head-to-head beats goal differential (two-team tie) -------------------

describe("two-team tie", () => {
  it("uses head-to-head even when the other team has a far better goal diff", () => {
    const teams = ["A", "B", "C", "D"].map(mkTeam);
    const games = [
      pool("A", 1, "B", 0), // A beat B head-to-head
      pool("C", 9, "A", 0), // C crushes A
      pool("B", 9, "D", 0), // B crushes D (big GD)
      pool("C", 1, "D", 0), // C second win
    ];
    const rows = computeStandings(teams, games);
    // C = 6 pts (top). A & B tied on 3; A beat B head-to-head despite
    // B's +8 differential vs A's -8.
    expect(order(rows)).toEqual(["C", "A", "B", "D"]);
  });
});

// --- conventional order: goal diff before goals scored ---------------------

describe("conventional tiebreaker order", () => {
  it("ranks by goal differential, not goals scored, when teams didn't meet", () => {
    const teams = ["X", "Y", "P", "Q"].map(mkTeam);
    const games = [
      pool("X", 10, "P", 8), // X: +2, many goals
      pool("Y", 3, "Q", 0), // Y: +3, few goals
    ];
    const rows = computeStandings(teams, games);
    // Old goals-first order would rank X (10 GF) above Y. Conventional order
    // ranks Y (+3) above X (+2).
    expect(order(rows).slice(0, 2)).toEqual(["Y", "X"]);
  });
});

// --- three-team tie: a scalar splits one off, the other two reopen H2H ------

describe("three-team tie", () => {
  it("splits the leader on goal diff, then reopens head-to-head for the pair", () => {
    const teams = ["A", "B", "C", "F1", "F2"].map(mkTeam);
    const games = [
      pool("F2", 1, "B", 0), // F2 beats B
      pool("F2", 2, "F1", 0), // F2 beats F1  -> F2 = 6 pts
      pool("A", 5, "F1", 1), // A = 3 pts, GD +4
      pool("B", 3, "C", 2), // B beats C (head-to-head); both head toward 3 pts
      pool("C", 4, "F1", 3), // C = 3 pts
    ];
    const rows = computeStandings(teams, games);
    // F2 (6) #1. A, B, C tied on 3: A's +4 GD takes #2. B and C tie on GD 0,
    // so head-to-head reopens -> B beat C -> B #3, C #4. F1 last.
    expect(order(rows)).toEqual(["F2", "A", "B", "C", "F1"]);
  });

  it("falls through to fewest goals against when GD ties and teams never met", () => {
    const teams = ["A", "B", "C", "F1", "F2", "F3"].map(mkTeam);
    const games = [
      pool("A", 5, "F1", 3), // A: +2, GA 3
      pool("B", 4, "F2", 2), // B: +2, GA 2  (fewest against)
      pool("C", 6, "F3", 4), // C: +2, GA 4
    ];
    const rows = computeStandings(teams, games);
    // A, B, C all 3 pts and +2 GD, none met. Fewest goals against breaks it:
    // B (2) < A (3) < C (4).
    expect(order(rows).slice(0, 3)).toEqual(["B", "A", "C"]);
  });

  it("flags a genuine deadlock for a shootout", () => {
    const teams = ["A", "B", "C"].map(mkTeam);
    // Everyone identical and nobody met -> unbreakable automatically.
    const games = [
      pool("A", 2, "X", 1),
      pool("B", 2, "Y", 1),
      pool("C", 2, "Z", 1),
      ...["X", "Y", "Z"].map((t) => t),
    ].filter((g): g is Game => typeof g !== "string");
    const allTeams = [...teams, ...["X", "Y", "Z"].map(mkTeam)];
    const rows = computeStandings(allTeams, games);
    const tied = rows.filter((r) => ["A", "B", "C"].includes(r.team.id));
    expect(tied.every((r) => r.needsShootout)).toBe(true);
  });
});

// --- bracket progression ----------------------------------------------------

describe("bracket progression", () => {
  const teams = ["s1", "s2", "s3", "s4", "s5"].map(mkTeam);

  // Pool results engineered to seed cleanly 1..5 by points.
  const poolGames: Game[] = [
    pool("s1", 9, "s2", 0),
    pool("s1", 9, "s3", 0),
    pool("s2", 9, "s3", 0),
    pool("s4", 5, "s5", 4),
    pool("s4", 1, "s1", 0),
    pool("s5", 1, "s2", 0),
  ];

  function bracketGames(): Game[] {
    const mk = (
      id: string,
      stage: Game["stage"],
      time: string,
      home: Game["home"],
      away: Game["away"],
    ): Game => ({
      id, divisionId: "test", stage, time, field: 1,
      home, away, homeScore: null, awayScore: null, status: "scheduled",
    });
    return [
      mk("PI", "play_in", "12:45", { kind: "seed", seed: 4 }, { kind: "seed", seed: 5 }),
      mk("SF1", "semi", "13:15", { kind: "seed", seed: 2 }, { kind: "seed", seed: 3 }),
      mk("SF2", "semi", "13:45", { kind: "seed", seed: 1 }, { kind: "winner", gameId: "PI" }),
      mk("F", "final", "14:30", { kind: "winner", gameId: "SF1" }, { kind: "winner", gameId: "SF2" }),
    ];
  }

  it("leaves seeds unresolved until pool play completes", () => {
    // All pool games exist, but one hasn't been played yet.
    const stillPlaying = poolGames.map((g, i) =>
      i === poolGames.length - 1
        ? { ...g, status: "scheduled" as const, homeScore: null, awayScore: null }
        : g,
    );
    const partial = [...stillPlaying, ...bracketGames()];
    expect(poolComplete(partial)).toBe(false);
    const resolved = resolveBracket(teams, partial);
    const playIn = resolved.find((r) => r.game.id === "PI")!;
    expect(playIn.home.team).toBeNull();
    expect(playIn.home.label).toBe("Seed 4");
  });

  it("populates seed slots once pool play is complete", () => {
    const games = [...poolGames, ...bracketGames()];
    const seedOrder = computeStandings(teams, games).map((r) => r.team.id);
    const resolved = resolveBracket(teams, games);
    const sf2 = resolved.find((r) => r.game.id === "SF2")!;
    // SF2 home is seed 1
    expect(sf2.home.team!.id).toBe(seedOrder[0]);
  });

  it("resolves a 'winner of' slot after that game is final", () => {
    const games = [...poolGames, ...bracketGames()];
    const seedOrder = computeStandings(teams, games).map((r) => r.team.id);
    const seed4 = seedOrder[3];
    // Play the play-in: seed 4 wins.
    const playIn = games.find((g) => g.id === "PI")!;
    playIn.status = "final";
    playIn.homeScore = 3; // home = seed 4
    playIn.awayScore = 1;
    const resolved = resolveBracket(teams, games);
    const sf2 = resolved.find((r) => r.game.id === "SF2")!;
    expect(sf2.away.team!.id).toBe(seed4);
  });
});
