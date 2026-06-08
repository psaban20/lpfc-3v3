import type { GameStatus, SeedingTiebreak } from "./types";
import type { StoredResult } from "./tournament-state";
import { tieGroupKey } from "./standings";
import { GAMES } from "../data/tournament";

// ---------------------------------------------------------------------------
// Result store.
//
// The schedule (teams, times, matchups) lives in code; only mutable game
// results -- and recorded PK-shootout seeding orders -- are persisted here. The
// default store is in-memory so the app runs and builds with zero setup. For
// the live tournament, set AZURE_SQL_CONNECTION and the app uses the Azure SQL
// adapter instead (see db-azure.ts and the README).
// ---------------------------------------------------------------------------

export interface ResultInput {
  homeScore: number | null;
  awayScore: number | null;
  status: GameStatus;
  decidedBy?: "home" | "away" | null;
}

export interface Store {
  getResults(): Promise<StoredResult[]>;
  saveResult(gameId: string, input: ResultInput): Promise<void>;
  clearResult(gameId: string): Promise<void>;
  resetAll(): Promise<void>;
  loadMany(results: Array<{ gameId: string } & ResultInput>): Promise<void>;
  getTiebreaks(): Promise<SeedingTiebreak[]>;
  saveTiebreak(divisionId: string, order: string[]): Promise<void>;
  clearTiebreaksForDivision(divisionId: string): Promise<void>;
}

const GAME_META = new Map(GAMES.map((g) => [g.id, { divisionId: g.divisionId, stage: g.stage }]));

export function assertValidGameId(gameId: string) {
  if (!GAME_META.has(gameId)) throw new Error(`Unknown game id: ${gameId}`);
}

// --- in-memory implementation (default) ------------------------------------

class InMemoryStore implements Store {
  // Survives module reloads in dev via globalThis so hot-reload doesn't wipe it.
  private get map(): Map<string, StoredResult> {
    const g = globalThis as unknown as { __lpfcResults?: Map<string, StoredResult> };
    if (!g.__lpfcResults) g.__lpfcResults = new Map();
    return g.__lpfcResults;
  }

  private get tiebreaks(): Map<string, SeedingTiebreak> {
    const g = globalThis as unknown as { __lpfcTiebreaks?: Map<string, SeedingTiebreak> };
    if (!g.__lpfcTiebreaks) g.__lpfcTiebreaks = new Map();
    return g.__lpfcTiebreaks;
  }

  async getResults() {
    return [...this.map.values()];
  }

  async saveResult(gameId: string, input: ResultInput) {
    assertValidGameId(gameId);
    this.map.set(gameId, {
      gameId,
      homeScore: input.homeScore,
      awayScore: input.awayScore,
      status: input.status,
      decidedBy: input.decidedBy ?? null,
    });
    this.invalidateTiebreaksFor(gameId);
  }

  async clearResult(gameId: string) {
    this.map.delete(gameId);
    this.invalidateTiebreaksFor(gameId);
  }

  async resetAll() {
    this.map.clear();
    this.tiebreaks.clear();
  }

  async loadMany(results: Array<{ gameId: string } & ResultInput>) {
    for (const r of results) await this.saveResult(r.gameId, r);
  }

  async getTiebreaks() {
    return [...this.tiebreaks.values()];
  }

  async saveTiebreak(divisionId: string, order: string[]) {
    if (!order.length) throw new Error("Tiebreak order is empty");
    this.tiebreaks.set(`${divisionId}|${tieGroupKey(order)}`, { divisionId, order });
  }

  async clearTiebreaksForDivision(divisionId: string) {
    for (const [k, v] of this.tiebreaks) {
      if (v.divisionId === divisionId) this.tiebreaks.delete(k);
    }
  }

  // A change to a pool result can shift the standings, so any recorded shootout
  // for that division is no longer valid -- drop it and let it be re-recorded.
  private invalidateTiebreaksFor(gameId: string) {
    const meta = GAME_META.get(gameId);
    if (meta && meta.stage === "pool") {
      for (const [k, v] of this.tiebreaks) {
        if (v.divisionId === meta.divisionId) this.tiebreaks.delete(k);
      }
    }
  }
}

let store: Store | null = null;

export function getStore(): Store {
  if (store) return store;
  if (process.env.AZURE_SQL_CONNECTION) {
    // Lazy require so the mssql dependency is only needed in production.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { AzureSqlStore } = require("./db-azure") as typeof import("./db-azure");
    store = new AzureSqlStore(process.env.AZURE_SQL_CONNECTION);
  } else {
    store = new InMemoryStore();
  }
  return store;
}
