import type { Game, Team, TeamRef, SeedingTiebreak } from "./types";
import { computeStandings, poolComplete } from "./standings";

// ---------------------------------------------------------------------------
// Bracket progression.
//
// Bracket games reference participants by SEED (#1..#5) or by the WINNER of an
// earlier bracket game. This resolves those references into concrete teams as
// results come in:
//   - seeds resolve once pool play is complete (standings are final)
//   - "winner of game X" resolves once game X has a winner
// ---------------------------------------------------------------------------

export interface ResolvedSlot {
  team: Team | null; // null = still to be determined
  label: string; // e.g. "Kraken Lime", "Seed 1", "Winner 12:45"
}

export interface ResolvedGame {
  game: Game;
  home: ResolvedSlot;
  away: ResolvedSlot;
  winner: Team | null;
}

function winnerOf(game: Game, resolved: Map<string, ResolvedGame>): Team | null {
  const r = resolved.get(game.id);
  if (!r) return null;
  if (game.status === "forfeit") {
    if (game.decidedBy === "home") return r.home.team;
    if (game.decidedBy === "away") return r.away.team;
    return null;
  }
  if (game.status !== "final") return null;
  const h = game.homeScore ?? 0;
  const a = game.awayScore ?? 0;
  if (h > a) return r.home.team;
  if (a > h) return r.away.team;
  // Level after regulation: bracket games are decided by shootout.
  if (game.decidedBy === "home") return r.home.team;
  if (game.decidedBy === "away") return r.away.team;
  return null;
}

function resolveRef(
  ref: TeamRef,
  teamsById: Map<string, Team>,
  seeds: Team[] | null,
  gamesById: Map<string, Game>,
  resolved: Map<string, ResolvedGame>,
): ResolvedSlot {
  if (ref.kind === "team") {
    return { team: teamsById.get(ref.teamId) ?? null, label: teamsById.get(ref.teamId)?.name ?? "?" };
  }
  if (ref.kind === "seed") {
    const team = seeds ? seeds[ref.seed - 1] ?? null : null;
    return { team, label: team ? team.name : `Seed ${ref.seed}` };
  }
  // winner of an earlier bracket game
  const src = gamesById.get(ref.gameId);
  const team = src ? winnerOf(src, resolved) : null;
  return { team, label: team ? team.name : `Winner ${src?.time ?? ref.gameId}` };
}

// Resolve every bracket game in a division. Bracket games must be passed in
// chronological order so "winner of" references point at already-resolved games.
export function resolveBracket(
  teams: Team[],
  games: Game[],
  tiebreaks: SeedingTiebreak[] = [],
): ResolvedGame[] {
  const teamsById = new Map(teams.map((t) => [t.id, t]));
  const gamesById = new Map(games.map((g) => [g.id, g]));

  const standings = computeStandings(teams, games, tiebreaks);
  const seeds: Team[] | null = poolComplete(games)
    ? standings.map((row) => row.team)
    : null;

  const bracketGames = games
    .filter((g) => g.stage !== "pool")
    .sort((a, b) => a.time.localeCompare(b.time));

  const resolved = new Map<string, ResolvedGame>();
  const out: ResolvedGame[] = [];

  for (const game of bracketGames) {
    const home = resolveRef(game.home, teamsById, seeds, gamesById, resolved);
    const away = resolveRef(game.away, teamsById, seeds, gamesById, resolved);
    const entry: ResolvedGame = { game, home, away, winner: null };
    resolved.set(game.id, entry);
    entry.winner = winnerOf(game, resolved);
    out.push(entry);
  }
  return out;
}
