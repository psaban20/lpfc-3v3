# LaPorte FC 3v3 Tournament

Live standings and brackets for the LaPorte FC summer 3v3 tournament at Kesling
Park. Replaces the Google Sheet standings calculator. Public board plus a
passcode-protected score-entry screen for volunteers at the fields.

- Three divisions (4/5 Coed, 4/5/6 Girls, Middle School), one field each.
- Five pool games per division (each team plays two), then a five-team bracket:
  play-in (#4 v #5), two semifinals (#2 v #3, and #1 v play-in winner), final.
- Standings are **computed on read** from game results — never stored stale.

## Tiebreaker order

Seeding out of pool play uses the conventional 3v3 order:

1. Points (win 3, draw 1, loss 0)
2. Head-to-head — **only when exactly two teams are tied**
3. Goal differential
4. Fewest goals against
5. Goals scored
6. PK shootout (manual — flagged on the board)

Special results: a **forfeit** is recorded as a 4-0 win; a game **not played**
is a 0-0 tie.

With three or more teams level, head-to-head is skipped (it goes circular). A
scalar tiebreaker that splits the group is applied, then each sub-group is
re-resolved from the top — so a sub-group that narrows to exactly two teams
**reopens head-to-head**. All of this is covered by the test suite.

## Run locally

```bash
npm install
cp .env.example .env.local   # set ADMIN_PASSCODE and SESSION_SECRET
npm run dev                  # http://localhost:3000
```

By default the app uses an **in-memory store** — zero database setup, perfect
for testing. Scores reset when the server restarts. (For the live event, use
Azure SQL — see below.)

- Public board: `/`
- Score entry: `/admin` (enter the passcode)

### Rehearse with mock scores

Sign in at `/admin`, open **Testing Tools**, and **Load mock scores**. This
fills every pool game with a set engineered to exercise the tricky tiebreakers
(a three-way tie resolved by goal-diff then a head-to-head reopen in Coed; a
three-way tie that falls through to fewest-goals-against in Girls). Watch the
standings seed and the bracket populate, then **Clear all scores** before the
real tournament.

## Test

```bash
npm test
```

The suite verifies the cascade against last year's published 4/5 standings plus
the edge cases (forfeit/not-played, head-to-head beating goal-diff, the
conventional order vs. the old goals-first order, three-team split + reopen,
fall-through, shootout flag, and bracket progression).

## Editing teams, schedule, or matchups

Everything about the tournament structure lives in
[`src/data/tournament.ts`](src/data/tournament.ts) — team names, coaches, pool
matchups, and times. The standings/bracket engine and the database don't need
to change to adjust the field.

## Production: Azure SQL

The in-memory store is fine for one machine but won't persist across restarts
or share state between replicas. For the live event, set
`AZURE_SQL_CONNECTION` and the app switches to the Azure SQL adapter
([`src/lib/db-azure.ts`](src/lib/db-azure.ts)). Create one table:

```sql
CREATE TABLE GameResult (
  gameId    NVARCHAR(64) NOT NULL PRIMARY KEY,
  homeScore INT NULL,
  awayScore INT NULL,
  status    NVARCHAR(16) NOT NULL DEFAULT 'scheduled',
  decidedBy NVARCHAR(8)  NULL,
  updatedAt DATETIME2    NOT NULL DEFAULT SYSUTCDATETIME()
);
```

When seeds tie all the way down, the admin records the PK-shootout finishing
order in the score-entry screen (a "Seeding Shootout" picker appears for exactly
the tied teams) and the bracket locks to that order. That order lives in a
second small table:

```sql
CREATE TABLE SeedingTiebreak (
  divisionId NVARCHAR(32)  NOT NULL,
  groupKey   NVARCHAR(512) NOT NULL,
  ordering   NVARCHAR(512) NOT NULL, -- JSON array of teamIds, best seed first
  PRIMARY KEY (divisionId, groupKey)
);
```

`mssql` is listed as an optional dependency; run `npm install` on a machine with
network access so it's available in the deployed image.

## Deploy: Azure Container Apps

The app builds to a standalone server (`output: "standalone"`) and ships with a
`Dockerfile`. Typical flow (matches the other LPFC frontends):

```bash
# build & push to your registry
az acr build --registry <your-registry> --image lpfc-3v3:latest .

# create or update the container app
az containerapp update \
  --name lpfc-3v3 \
  --resource-group <your-rg> \
  --image <your-registry>.azurecr.io/lpfc-3v3:latest \
  --set-env-vars ADMIN_PASSCODE=secretref:admin-passcode \
                 SESSION_SECRET=secretref:session-secret \
                 AZURE_SQL_CONNECTION=secretref:azure-sql
```

Point `3v3.laportefc.soccer` at the container app and add it as a custom domain.
A sample GitHub Actions workflow is in `.github/workflows/deploy.yml` (fill in
the placeholders).

## Auth note

One shared `ADMIN_PASSCODE` gates score entry — simplest for volunteers sharing
a screen at the fields. A correct passcode mints an HMAC-signed, http-only
cookie good for a tournament day. If per-person audit is ever wanted, the auth
layer ([`src/lib/auth.ts`](src/lib/auth.ts)) can be swapped for Google Workspace
sign-in without touching the rest of the app.
