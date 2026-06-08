// Core domain types for the LaPorte FC 3v3 tournament app.
// These describe the tournament structure independent of any database.

export type GameStage = "pool" | "play_in" | "semi" | "final";

// scheduled  -> no result yet
// final      -> played, scores recorded
// forfeit     -> recorded as a 4-0 win for the present team
// not_played  -> recorded as a 0-0 tie (per the rules: a game not played is 0-0)
export type GameStatus = "scheduled" | "final" | "forfeit" | "not_played";

export interface Team {
  id: string;
  divisionId: string;
  name: string;
  coach?: string;
}

// A bracket game's participants aren't known until pool play (and earlier
// bracket games) finish. A TeamRef resolves to a concrete team at read time.
export type TeamRef =
  | { kind: "team"; teamId: string }
  | { kind: "seed"; seed: number } // 1-based seed from pool standings
  | { kind: "winner"; gameId: string }; // winner of an earlier bracket game

export interface Game {
  id: string;
  divisionId: string;
  stage: GameStage;
  time: string;
  field: number;
  home: TeamRef;
  away: TeamRef;
  homeScore: number | null;
  awayScore: number | null;
  status: GameStatus;
  // For forfeits, which side gets the 4-0 win. For bracket games that end
  // level after regulation, which side won the shootout. Null otherwise.
  decidedBy?: "home" | "away" | null;
}

export interface Division {
  id: string;
  name: string;
  field: number;
  order: number;
}

// A single computed row in a division standings table.
export interface StandingRow {
  team: Team;
  seed: number; // 1-based, assigned after the cascade
  played: number;
  wins: number;
  draws: number;
  losses: number;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  // True when this team is still tied with another after every automatic
  // tiebreaker — the rules call for a PK shootout, which is a manual step.
  needsShootout: boolean;
}
