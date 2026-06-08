import type { Store, ResultInput } from "./db";
import { assertValidGameId } from "./db";
import type { StoredResult, } from "./tournament-state";
import type { GameStatus } from "./types";

// ---------------------------------------------------------------------------
// Azure SQL implementation. Activated when AZURE_SQL_CONNECTION is set.
//
// Requires the `mssql` package (listed as an optional dependency). The single
// table mirrors the in-memory model: one row per played game.
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
// The connection string is a standard ADO/mssql config or URL. See the README.
// ---------------------------------------------------------------------------

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
  }

  async resetAll(): Promise<void> {
    const pool = await this.pool();
    await pool.request().query("DELETE FROM GameResult");
  }

  async loadMany(results: Array<{ gameId: string } & ResultInput>): Promise<void> {
    for (const r of results) await this.saveResult(r.gameId, r);
  }
}
