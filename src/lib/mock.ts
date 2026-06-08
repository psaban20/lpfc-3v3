import type { GameStatus } from "./types";

export interface MockResult {
  gameId: string;
  homeScore: number | null;
  awayScore: number | null;
  status: GameStatus;
  decidedBy?: "home" | "away" | null;
}

const f = (gameId: string, h: number, a: number): MockResult => ({
  gameId,
  homeScore: h,
  awayScore: a,
  status: "final",
});

// Pool results only -- the bracket is left unplayed so testers can watch seeds
// populate and enter bracket scores live.
//
// 4/5 Coed: Atletico runs the table (6). Penguins/Bananas/Kraken Orange tie on
//   3. Penguins split off on goal diff; Bananas & Kraken Orange tie on GD, so
//   head-to-head REOPENS -> Bananas beat Kraken Orange in pool -> Bananas above.
//
// Girls: Pitch/Wonder/Girl Squad all tie on 4 pts AND +2 goal diff. Their only
//   head-to-head (Pitch 1-1 Wonder) is a draw -> inconclusive, so it FALLS
//   THROUGH to fewest goals against: Wonder (1) < Pitch (2) < Girl Squad (3).
//
// Middle School: a clean spread, no ties.
export const MOCK_RESULTS: MockResult[] = [
  // 4/5 Coed
  f("coed-P1", 0, 3), // Kraken Lime 0-3 Penguins
  f("coed-P2", 2, 1), // Bananas 2-1 Kraken Orange  (head-to-head)
  f("coed-P3", 3, 0), // Atletico 3-0 Kraken Lime
  f("coed-P4", 1, 2), // Penguins 1-2 Kraken Orange
  f("coed-P5", 2, 1), // Atletico 2-1 Bananas

  // 4/5/6 Girls
  f("girls-P1", 1, 3), // Ladythugs 1-3 Pitch Perfect
  f("girls-P2", 0, 2), // Little Sparkles 0-2 Wonder Women
  f("girls-P3", 4, 2), // Girl Squad 4-2 Ladythugs
  f("girls-P4", 1, 1), // Pitch Perfect 1-1 Wonder Women (inconclusive H2H)
  f("girls-P5", 1, 1), // Girl Squad 1-1 Little Sparkles

  // Middle School
  f("ms-P1", 3, 1), // Orange Outlaws 3-1 New Prairie
  f("ms-P2", 2, 2), // Brazil FC 2-2 Tacos
  f("ms-P3", 4, 0), // Grass Stains 4-0 Orange Outlaws
  f("ms-P4", 1, 3), // New Prairie 1-3 Tacos
  f("ms-P5", 2, 1), // Grass Stains 2-1 Brazil FC
];
