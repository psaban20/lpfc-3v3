import type { GameStatus } from "./types";
import type { StoredResult } from "./tournament-state";
import { GAMES } from "../data/tournament";

// ---------------------------------------------------------------------------
// Result store.
//
// The schedule (teams, times, matchups) lives in code; only mutable game
// results are persisted here. The default store is in-memory so the app runs
// and builds with zero setup -- ideal for local UI testing and mock-score
// runs. For the live tournament, set AZURE_SQL_CONNECTION and the app uses the
// Azure SQL adapter instead (see db-azure.ts and the README).
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
  resetAll(): Promise<void>;
  loadMany(results: Array<{ gameId: string } & ResultInput>): Promise<void>;
}

const VALID_GAME_IDS = new Set(GAMES.map((g) => g.id));

export function assertValidGameId(gameId: string) {
  if (!VALID_GAME_IDS.has(gameId)) throw new Error(`Unknown game id: ${gameId}`);
}

// --- in-memory implementation (default) ------------------------------------

class InMemoryStore implements Store {
  // Survives module reloads in dev via globalThis so hot-reload doesn't wipe it.
  private get map(): Map<string, StoredResult> {
    const g = globalThis as unknown as { __lpfcResults?: Map<string, StoredResult> };
    if (!g.__lpfcResults) g.__lpfcResults = new Map();
    return g.__lpfcResults;
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
  }

  async resetAll() {
    this.map.clear();
  }

  async loadMany(results: Array<{ gameId: string } & ResultInput>) {
    for (const r of results) await this.saveResult(r.gameId, r);
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
