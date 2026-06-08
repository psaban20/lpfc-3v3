import type { Game, Team, StandingRow, GameStatus } from "./types";

// ---------------------------------------------------------------------------
// LaPorte FC 3v3 standings engine.
//
// Replaces the nested-formula Google Sheet. Pure functions, no I/O.
//
// Scoring:        win = 3, draw = 1, loss = 0
// Forfeit:        recorded as a 4-0 win for the team that showed up
// Game not played: recorded as a 0-0 tie
//
// Seeding tiebreaker order (confirmed, conventional 3v3 order):
//   1. Points
//   2. Head-to-head  -- ONLY when exactly two teams are tied
//   3. Goal differential
//   4. Fewest goals against
//   5. Goals scored
//   6. PK shootout   -- manual; flagged, not auto-resolved
//
// Multi-team ties: with three or more teams level, head-to-head is skipped
// (it goes circular). A scalar tiebreaker that splits the group is applied,
// then each remaining sub-group is re-resolved from the top -- so a sub-group
// that shrinks to exactly two teams reopens head-to-head for those two.
// ---------------------------------------------------------------------------

const FORFEIT_SCORE = 4;

interface Tally {
  team: Team;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
}

// A game counts toward standings only once it has a result.
function hasResult(status: GameStatus): boolean {
  return status === "final" || status === "forfeit" || status === "not_played";
}

// Resolve a finished game into (homeGoals, awayGoals) applying the special
// rules for forfeits (4-0) and not-played (0-0).
function resultGoals(game: Game): { home: number; away: number } | null {
  if (!hasResult(game.status)) return null;
  if (game.status === "not_played") return { home: 0, away: 0 };
  if (game.status === "forfeit") {
    if (game.decidedBy === "home") return { home: FORFEIT_SCORE, away: 0 };
    if (game.decidedBy === "away") return { home: 0, away: FORFEIT_SCORE };
    return { home: 0, away: 0 }; // double forfeit -> 0-0, both lose
  }
  return { home: game.homeScore ?? 0, away: game.awayScore ?? 0 };
}

function blankTally(team: Team): Tally {
  return {
    team,
    played: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    points: 0,
    goalsFor: 0,
    goalsAgainst: 0,
  };
}

// Only pool games feed the standings/seeding.
function poolGames(games: Game[]): Game[] {
  return games.filter((g) => g.stage === "pool");
}

function teamRefId(ref: Game["home"]): string | null {
  return ref.kind === "team" ? ref.teamId : null;
}

function buildTallies(teams: Team[], games: Game[]): Map<string, Tally> {
  const tallies = new Map<string, Tally>();
  for (const t of teams) tallies.set(t.id, blankTally(t));

  for (const game of poolGames(games)) {
    const goals = resultGoals(game);
    if (!goals) continue;
    const homeId = teamRefId(game.home);
    const awayId = teamRefId(game.away);
    if (!homeId || !awayId) continue;
    const home = tallies.get(homeId);
    const away = tallies.get(awayId);
    if (!home || !away) continue;

    const doubleForfeit = game.status === "forfeit" && game.decidedBy == null;

    home.played++;
    away.played++;
    home.goalsFor += goals.home;
    home.goalsAgainst += goals.away;
    away.goalsFor += goals.away;
    away.goalsAgainst += goals.home;

    if (doubleForfeit) {
      home.losses++;
      away.losses++;
      continue;
    }
    if (goals.home > goals.away) {
      home.wins++;
      home.points += 3;
      away.losses++;
    } else if (goals.home < goals.away) {
      away.wins++;
      away.points += 3;
      home.losses++;
    } else {
      home.draws++;
      away.draws++;
      home.points += 1;
      away.points += 1;
    }
  }
  return tallies;
}

const gd = (t: Tally) => t.goalsFor - t.goalsAgainst;

// Head-to-head between exactly two teams: returns the winner's id, or null if
// they didn't meet in pool play or drew (inconclusive -> fall through).
function headToHead(a: Tally, b: Tally, games: Game[]): string | null {
  for (const game of poolGames(games)) {
    const goals = resultGoals(game);
    if (!goals) continue;
    const homeId = teamRefId(game.home);
    const awayId = teamRefId(game.away);
    if (!homeId || !awayId) continue;
    const pair = new Set([homeId, awayId]);
    if (!pair.has(a.team.id) || !pair.has(b.team.id)) continue;
    if (goals.home === goals.away) return null; // drew -> inconclusive
    const winnerId = goals.home > goals.away ? homeId : awayId;
    return winnerId;
  }
  return null; // never met
}

// Partition a group by a scalar metric. Returns sub-groups already ordered
// best-first. `higherIsBetter` is false for "fewest goals against".
function partitionByMetric(
  group: Tally[],
  metric: (t: Tally) => number,
  higherIsBetter: boolean,
): Tally[][] {
  const byValue = new Map<number, Tally[]>();
  for (const t of group) {
    const v = metric(t);
    const bucket = byValue.get(v);
    if (bucket) bucket.push(t);
    else byValue.set(v, [t]);
  }
  const values = [...byValue.keys()].sort((x, y) =>
    higherIsBetter ? y - x : x - y,
  );
  return values.map((v) => byValue.get(v)!);
}

// Resolve an ordering within a group of teams already tied on points.
// Returns the group ordered best-first; teams left genuinely tied keep their
// incoming order and are flagged for a manual shootout.
function rankTiedGroup(
  group: Tally[],
  games: Game[],
  unresolved: Set<string>,
): Tally[] {
  if (group.length <= 1) return group;

  // Head-to-head is only meaningful (and non-circular) for exactly two teams.
  if (group.length === 2) {
    const [a, b] = group;
    const winnerId = headToHead(a, b, games);
    if (winnerId) {
      return winnerId === a.team.id ? [a, b] : [b, a];
    }
    // inconclusive -> fall through to the scalar cascade
  }

  // Scalar cascade: goal differential -> fewest goals against -> goals scored.
  const scalars: Array<{ metric: (t: Tally) => number; higherIsBetter: boolean }> = [
    { metric: gd, higherIsBetter: true },
    { metric: (t) => t.goalsAgainst, higherIsBetter: false },
    { metric: (t) => t.goalsFor, higherIsBetter: true },
  ];

  for (const { metric, higherIsBetter } of scalars) {
    const parts = partitionByMetric(group, metric, higherIsBetter);
    if (parts.length > 1) {
      // This criterion split the group. Re-resolve each sub-group from the
      // top -- a sub-group of two reopens head-to-head.
      return parts.flatMap((sub) => rankTiedGroup(sub, games, unresolved));
    }
  }

  // Nothing separated them -> genuinely tied. Rules call for a PK shootout.
  for (const t of group) unresolved.add(t.team.id);
  return group;
}

// Compute the full ordered standings for one division.
export function computeStandings(teams: Team[], games: Game[]): StandingRow[] {
  const tallies = buildTallies(teams, games);
  const all = [...tallies.values()];
  const unresolved = new Set<string>();

  // Top-level sort by points, then resolve each equal-points group.
  const byPoints = partitionByMetric(all, (t) => t.points, true);
  const ordered = byPoints.flatMap((group) =>
    rankTiedGroup(group, games, unresolved),
  );

  return ordered.map((t, i) => ({
    team: t.team,
    seed: i + 1,
    played: t.played,
    wins: t.wins,
    draws: t.draws,
    losses: t.losses,
    points: t.points,
    goalsFor: t.goalsFor,
    goalsAgainst: t.goalsAgainst,
    goalDiff: gd(t),
    needsShootout: unresolved.has(t.team.id),
  }));
}

// True once every pool game in the division has a result -- i.e. seeds are
// final and the bracket can be populated.
export function poolComplete(games: Game[]): boolean {
  const pool = poolGames(games);
  return pool.length > 0 && pool.every((g) => hasResult(g.status));
}
