import type { Division, Team, Game, TeamRef } from "../lib/types";

// ---------------------------------------------------------------------------
// 2026 LaPorte FC 3v3 Tournament -- Kesling Park.
// Three divisions, five teams each. Five pool games per division (each team
// plays two), then a five-team bracket: play-in (#4 v #5), two semifinals
// (#2 v #3, and #1 v play-in winner), and a final.
// ---------------------------------------------------------------------------

export const DIVISIONS: Division[] = [
  { id: "coed", name: "4/5 Coed", field: 1, order: 1 },
  { id: "girls", name: "4/5/6 Girls", field: 2, order: 2 },
  { id: "ms", name: "Middle School", field: 3, order: 3 },
];

interface DivisionSeed {
  divisionId: string;
  field: number;
  teams: { id: string; name: string; coach: string }[];
  // pool games as [time, homeTeamId, awayTeamId]
  pool: [string, string, string][];
}

const SEED: DivisionSeed[] = [
  {
    divisionId: "coed",
    field: 1,
    teams: [
      { id: "coed-atletico", name: "Atletico LaPorte", coach: "Goyo Aguilera" },
      { id: "coed-bananas", name: "Bananas", coach: "Scott Strandberg" },
      { id: "coed-penguins", name: "Penguins", coach: "Kayte Gardner" },
      { id: "coed-kraken-lime", name: "Kraken Lime", coach: "Joe Lentner" },
      { id: "coed-kraken-orange", name: "Kraken Orange", coach: "Melissa Berumen" },
    ],
    pool: [
      ["10:00", "coed-kraken-lime", "coed-penguins"],
      ["10:30", "coed-bananas", "coed-kraken-orange"],
      ["11:00", "coed-atletico", "coed-kraken-lime"],
      ["11:30", "coed-penguins", "coed-kraken-orange"],
      ["12:00", "coed-atletico", "coed-bananas"],
    ],
  },
  {
    divisionId: "girls",
    field: 2,
    teams: [
      { id: "girls-wonder", name: "Wonder Women", coach: "Eric Corona" },
      { id: "girls-pitch", name: "Pitch Perfect", coach: "Jeremy Ruff & Saige Wiles" },
      { id: "girls-sparkles", name: "Little Sparkles", coach: "Luis Gutierrez" },
      { id: "girls-squad", name: "Girl Squad", coach: "Kirst Alycia" },
      { id: "girls-ladythugs", name: "Ladythugs", coach: "Keith Norred" },
    ],
    pool: [
      ["10:00", "girls-ladythugs", "girls-pitch"],
      ["10:30", "girls-sparkles", "girls-wonder"],
      ["11:00", "girls-squad", "girls-ladythugs"],
      ["11:30", "girls-pitch", "girls-wonder"],
      ["12:00", "girls-squad", "girls-sparkles"],
    ],
  },
  {
    divisionId: "ms",
    field: 3,
    teams: [
      { id: "ms-brazil", name: "Brazil FC", coach: "Victor Vargas" },
      { id: "ms-newprairie", name: "New Prairie", coach: "Melinda Carpenter" },
      { id: "ms-outlaws", name: "Orange Outlaws", coach: "Lauren Mclennan" },
      { id: "ms-grass", name: "Grass Stains", coach: "Pablo Saban" },
      { id: "ms-tacos", name: "Tacos", coach: "James Amor" },
    ],
    pool: [
      ["10:00", "ms-outlaws", "ms-newprairie"],
      ["10:30", "ms-brazil", "ms-tacos"],
      ["11:00", "ms-grass", "ms-outlaws"],
      ["11:30", "ms-newprairie", "ms-tacos"],
      ["12:00", "ms-grass", "ms-brazil"],
    ],
  },
];

const team = (teamId: string): TeamRef => ({ kind: "team", teamId });
const seed = (n: number): TeamRef => ({ kind: "seed", seed: n });
const winner = (gameId: string): TeamRef => ({ kind: "winner", gameId });

export const TEAMS: Team[] = SEED.flatMap((d) =>
  d.teams.map((t) => ({ id: t.id, divisionId: d.divisionId, name: t.name, coach: t.coach })),
);

export const GAMES: Game[] = SEED.flatMap((d) => {
  const p = (n: number) => `${d.divisionId}-P${n}`;
  const pool: Game[] = d.pool.map(([time, home, away], i) => ({
    id: p(i + 1),
    divisionId: d.divisionId,
    stage: "pool" as const,
    time,
    field: d.field,
    home: team(home),
    away: team(away),
    homeScore: null,
    awayScore: null,
    status: "scheduled" as const,
  }));

  const playIn = `${d.divisionId}-PI`;
  const semiA = `${d.divisionId}-SF1`;
  const semiB = `${d.divisionId}-SF2`;

  const bracket: Game[] = [
    {
      id: playIn,
      divisionId: d.divisionId,
      stage: "play_in",
      time: "12:45",
      field: d.field,
      home: seed(4),
      away: seed(5),
      homeScore: null,
      awayScore: null,
      status: "scheduled",
    },
    {
      id: semiA,
      divisionId: d.divisionId,
      stage: "semi",
      time: "13:15",
      field: d.field,
      home: seed(2),
      away: seed(3),
      homeScore: null,
      awayScore: null,
      status: "scheduled",
    },
    {
      id: semiB,
      divisionId: d.divisionId,
      stage: "semi",
      time: "13:45",
      field: d.field,
      home: seed(1),
      away: winner(playIn),
      homeScore: null,
      awayScore: null,
      status: "scheduled",
    },
    {
      id: `${d.divisionId}-F`,
      divisionId: d.divisionId,
      stage: "final",
      time: "14:30",
      field: d.field,
      home: winner(semiA),
      away: winner(semiB),
      homeScore: null,
      awayScore: null,
      status: "scheduled",
    },
  ];

  return [...pool, ...bracket];
});
