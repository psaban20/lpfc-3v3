import type { Store, ResultInput } from "./db";
import { assertValidGameId } from "./db";
import type { StoredResult } from "./tournament-state";
import type { GameStatus, SeedingTiebreak } from "./types";
import { tieGroupKey } from "./standings";
import { GAMES } from "../data/tournament";

// ---------------------------------------------------------------------------
// Azure SQL implementation. Activated when AZURE_SQL_CONNECTION is set.
//
// Requires the `mssql` package (listed as an optional dependency). Two tables:
//
//   CREATE TABLE GameResult (
//     gameId    NVARCHAR(64) NOT NULL PRIMARY KEY,
//     homeScore INT NULL,
//     awayScore INT NULL,
//     status    NVARCHAR(16) NOT NULL DEFAULT 'scheduled',
//     decidedBy NVARCHAR(8)  NULL,
//     updatedAt DATETIME2    NOT NULL DEFAULT SYSUTCDATETIME()
//   );
//
//   CREATE TABLE SeedingTiebreak (
//     divisionId NVARCHAR(32)  NOT NULL,
//     groupKey   NVARCHAR(512) NOT NULL,
//     ordering   NVARCHAR(512) NOT NULL, -- JSON array of teamIds, best seed first
//     PRIMARY KEY (divisionId, groupKey)
//   );
//
// The connection string is a standard ADO/mssql config or URL. See the README.
// ---------------------------------------------------------------------------

const GAME_META = new Map(GAMES.map((g) => [g.id, { divisionId: g.divisionId, stage: g.stage }]));

export class AzureSqlStore implements Store {
  // typed loosely so the build needs no @types/mssql; the adapter only
  // loads in production when AZURE_SQL_CONNECTION is set.
  private poolPromise: Promise<any>;

  constructor(connection: string) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const sql = require("mssql");
    this.poolPromise = sql.connect(connection);
  }

  private async pool(): Promise<any> {
    return this.poolPromise;
  }

  async getResults(): Promise<StoredResult[]> {
    const pool = await this.pool();
    const res = await pool.request().query(
      "SELECT gameId, homeScore, awayScore, status, decidedBy FROM GameResult",
    );
    return res.recordset.map((r: Record<string, unknown>) => ({
      gameId: r.gameId as string,
      homeScore: (r.homeScore as number | null) ?? null,
      awayScore: (r.awayScore as number | null) ?? null,
      status: r.status as GameStatus,
      decidedBy: (r.decidedBy as "home" | "away" | null) ?? null,
    }));
  }

  async saveResult(gameId: string, input: ResultInput): Promise<void> {
    assertValidGameId(gameId);
    const pool = await this.pool();
    await pool
      .request()
      .input("gameId", gameId)
      .input("homeScore", input.homeScore)
      .input("awayScore", input.awayScore)
      .input("status", input.status)
      .input("decidedBy", input.decidedBy ?? null)
      .query(`
        MERGE GameResult AS t
        USING (SELECT @gameId AS gameId) AS s ON t.gameId = s.gameId
        WHEN MATCHED THEN UPDATE SET
          homeScore = @homeScore, awayScore = @awayScore,
          status = @status, decidedBy = @decidedBy, updatedAt = SYSUTCDATETIME()
        WHEN NOT MATCHED THEN INSERT (gameId, homeScore, awayScore, status, decidedBy)
          VALUES (@gameId, @homeScore, @awayScore, @status, @decidedBy);
      `);
    await this.invalidateTiebreaksFor(gameId);
  }

  async clearResult(gameId: string): Promise<void> {
    assertValidGameId(gameId);
    const pool = await this.pool();
    await pool
      .request()
      .input("gameId", gameId)
      .query("DELETE FROM GameResult WHERE gameId = @gameId");
    await this.invalidateTiebreaksFor(gameId);
  }

  async resetAll(): Promise<void> {
    const pool = await this.pool();
    await pool.request().query("DELETE FROM GameResult");
    await pool.request().query("DELETE FROM SeedingTiebreak");
  }

  async loadMany(results: Array<{ gameId: string } & ResultInput>): Promise<void> {
    for (const r of results) await this.saveResult(r.gameId, r);
  }

  async getTiebreaks(): Promise<SeedingTiebreak[]> {
    const pool = await this.pool();
    const res = await pool.request().query("SELECT divisionId, ordering FROM SeedingTiebreak");
    return res.recordset.map((r: Record<string, unknown>) => ({
      divisionId: r.divisionId as string,
      order: JSON.parse(r.ordering as string) as string[],
    }));
  }

  async saveTiebreak(divisionId: string, order: string[]): Promise<void> {
    if (!order.length) throw new Error("Tiebreak order is empty");
    const pool = await this.pool();
    await pool
      .request()
      .input("divisionId", divisionId)
      .input("groupKey", tieGroupKey(order))
      .input("ordering", JSON.stringify(order))
      .query(`
        MERGE SeedingTiebreak AS t
        USING (SELECT @divisionId AS divisionId, @groupKey AS groupKey) AS s
          ON t.divisionId = s.divisionId AND t.groupKey = s.groupKey
        WHEN MATCHED THEN UPDATE SET ordering = @ordering
        WHEN NOT MATCHED THEN INSERT (divisionId, groupKey, ordering)
          VALUES (@divisionId, @groupKey, @ordering);
      `);
  }

  async clearTiebreaksForDivision(divisionId: string): Promise<void> {
    const pool = await this.pool();
    await pool
      .request()
      .input("divisionId", divisionId)
      .query("DELETE FROM SeedingTiebreak WHERE divisionId = @divisionId");
  }

  private async invalidateTiebreaksFor(gameId: string): Promise<void> {
    const meta = GAME_META.get(gameId);
    if (meta && meta.stage === "pool") {
      await this.clearTiebreaksForDivision(meta.divisionId);
    }
  }
}
