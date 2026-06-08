import type { GameStatus } from "./types";
import { mergeResults, divisionView, DIVISIONS } from "./tournament-state";
import { getStore } from "./db";

export interface PresentStanding {
  teamId: string;
  name: string;
  coach?: string;
  seed: number;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  needsShootout: boolean;
}

export interface PresentGame {
  id: string;
  time: string;
  field: number;
  stage: "pool" | "play_in" | "semi" | "final";
  stageLabel: string;
  homeLabel: string;
  awayLabel: string;
  homeReady: boolean; // both participants known -> score entry allowed
  awayReady: boolean;
  homeScore: number | null;
  awayScore: number | null;
  status: GameStatus;
  decidedBy: "home" | "away" | null;
  winnerLabel: string | null;
}

export interface PresentDivision {
  id: string;
  name: string;
  field: number;
  poolComplete: boolean;
  standings: PresentStanding[];
  pool: PresentGame[];
  bracket: PresentGame[];
}

const STAGE_LABEL: Record<string, string> = {
  pool: "Pool",
  play_in: "Play-in",
  semi: "Semifinal",
  final: "Final",
};

function buildDivision(divId: string, games: ReturnType<typeof mergeResults>): PresentDivision {
  const v = divisionView(divId, games);

  const standings: PresentStanding[] = v.standings.map((r) => ({
    teamId: r.team.id,
    name: r.team.name,
    coach: r.team.coach,
    seed: r.seed,
    played: r.played,
    wins: r.wins,
    draws: r.draws,
    losses: r.losses,
    points: r.points,
    goalsFor: r.goalsFor,
    goalsAgainst: r.goalsAgainst,
    goalDiff: r.goalDiff,
    needsShootout: r.needsShootout,
  }));

  const nameById = new Map(v.standings.map((r) => [r.team.id, r.team.name]));

  const pool: PresentGame[] = v.poolGames.map((g) => {
    const homeLabel = g.home.kind === "team" ? nameById.get(g.home.teamId) ?? "?" : "?";
    const awayLabel = g.away.kind === "team" ? nameById.get(g.away.teamId) ?? "?" : "?";
    let winnerLabel: string | null = null;
    if (g.status === "final" && g.homeScore != null && g.awayScore != null) {
      if (g.homeScore > g.awayScore) winnerLabel = homeLabel;
      else if (g.awayScore > g.homeScore) winnerLabel = awayLabel;
    } else if (g.status === "forfeit") {
      winnerLabel = g.decidedBy === "home" ? homeLabel : g.decidedBy === "away" ? awayLabel : null;
    }
    return {
      id: g.id,
      time: g.time,
      field: g.field,
      stage: "pool",
      stageLabel: STAGE_LABEL.pool,
      homeLabel,
      awayLabel,
      homeReady: true,
      awayReady: true,
      homeScore: g.homeScore,
      awayScore: g.awayScore,
      status: g.status,
      decidedBy: g.decidedBy ?? null,
      winnerLabel,
    };
  });

  const bracket: PresentGame[] = v.bracket.map((b) => {
    const g = b.game;
    return {
      id: g.id,
      time: g.time,
      field: g.field,
      stage: g.stage as PresentGame["stage"],
      stageLabel: STAGE_LABEL[g.stage] ?? g.stage,
      homeLabel: b.home.label,
      awayLabel: b.away.label,
      homeReady: b.home.team != null,
      awayReady: b.away.team != null,
      homeScore: g.homeScore,
      awayScore: g.awayScore,
      status: g.status,
      decidedBy: g.decidedBy ?? null,
      winnerLabel: b.winner ? b.winner.name : null,
    };
  });

  return {
    id: v.division.id,
    name: v.division.name,
    field: v.division.field,
    poolComplete: v.poolComplete,
    standings,
    pool,
    bracket,
  };
}

// Read current results from the store and build every division view.
export async function getPresentDivisions(): Promise<PresentDivision[]> {
  const results = await getStore().getResults();
  const games = mergeResults(results);
  return [...DIVISIONS]
    .sort((a, b) => a.order - b.order)
    .map((d) => buildDivision(d.id, games));
}
