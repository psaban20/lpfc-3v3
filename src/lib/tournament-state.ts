import type { Game, GameStatus, SeedingTiebreak } from "./types";
import { GAMES, TEAMS, DIVISIONS } from "../data/tournament";
import { computeStandings, poolComplete } from "./standings";
import { resolveBracket } from "./bracket";

// A stored result overlays the static schedule. The schedule (teams, times,
// matchups) lives in code; only mutable results live in the database.
export interface StoredResult {
  gameId: string;
  homeScore: number | null;
  awayScore: number | null;
  status: GameStatus;
  decidedBy: "home" | "away" | null;
}

export function mergeResults(results: StoredResult[]): Game[] {
  const byId = new Map(results.map((r) => [r.gameId, r]));
  return GAMES.map((g) => {
    const r = byId.get(g.id);
    if (!r) return g;
    return {
      ...g,
      homeScore: r.homeScore,
      awayScore: r.awayScore,
      status: r.status,
      decidedBy: r.decidedBy,
    };
  });
}

export function divisionView(
  divisionId: string,
  games: Game[],
  tiebreaks: SeedingTiebreak[] = [],
) {
  const division = DIVISIONS.find((d) => d.id === divisionId)!;
  const teams = TEAMS.filter((t) => t.divisionId === divisionId);
  const divGames = games.filter((g) => g.divisionId === divisionId);
  const tb = tiebreaks.filter((t) => t.divisionId === divisionId);
  const pool = divGames
    .filter((g) => g.stage === "pool")
    .sort((a, b) => a.time.localeCompare(b.time));

  return {
    division,
    standings: computeStandings(teams, divGames, tb),
    poolGames: pool,
    poolComplete: poolComplete(divGames),
    bracket: resolveBracket(teams, divGames, tb),
  };
}

export function allDivisionViews(games: Game[], tiebreaks: SeedingTiebreak[] = []) {
  return [...DIVISIONS]
    .sort((a, b) => a.order - b.order)
    .map((d) => divisionView(d.id, games, tiebreaks));
}

export { DIVISIONS, TEAMS, GAMES };
