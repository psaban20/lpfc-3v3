import { describe, it, expect } from "vitest";
import { MOCK_RESULTS } from "./mock";
import { mergeResults, divisionView } from "./tournament-state";

describe("mock data exercises the tiebreakers as designed", () => {
  const games = mergeResults(MOCK_RESULTS);

  it("Coed: three-way tie splits on GD then reopens head-to-head", () => {
    const seeds = divisionView("coed", games).standings.map((r) => r.team.name);
    expect(seeds).toEqual([
      "Atletico LaPorte", // 6 pts
      "Penguins", // 3 pts, GD +2 -> split off top of the tied group
      "Bananas", // 3 pts, GD 0, beat Kraken Orange head-to-head
      "Kraken Orange", // 3 pts, GD 0, lost the head-to-head
      "Kraken Lime", // 0 pts
    ]);
  });

  it("Girls: three-way tie falls through to fewest goals against", () => {
    const seeds = divisionView("girls", games).standings.map((r) => r.team.name);
    expect(seeds).toEqual([
      "Wonder Women", // 4 pts, +2, 1 GA
      "Pitch Perfect", // 4 pts, +2, 2 GA
      "Girl Squad", // 4 pts, +2, 3 GA
      "Little Sparkles", // 1 pt
      "Ladythugs", // 0 pts
    ]);
  });

  it("Middle School: clean spread, no ties needing a shootout", () => {
    const view = divisionView("ms", games);
    const seeds = view.standings.map((r) => r.team.name);
    expect(seeds).toEqual([
      "Grass Stains",
      "Tacos",
      "Orange Outlaws",
      "Brazil FC",
      "New Prairie",
    ]);
    expect(view.standings.some((r) => r.needsShootout)).toBe(false);
  });

  it("pool is complete so bracket seeds populate", () => {
    const view = divisionView("coed", games);
    expect(view.poolComplete).toBe(true);
    const semiB = view.bracket.find((b) => b.game.stage === "semi" && b.game.id === "coed-SF2")!;
    expect(semiB.home.team!.name).toBe("Atletico LaPorte"); // seed 1
  });
});
