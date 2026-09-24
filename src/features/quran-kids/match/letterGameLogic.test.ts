import { describe, expect, it } from "vitest";
import type { ArabicLetter } from "./arabicLetters";
import { buildLetterMatchRound, isMatchingPair } from "./letterGameLogic";

const letters: ArabicLetter[] = [
  { letter: "ا", name: "ألف", exampleWord: "أسد" },
  { letter: "ب", name: "باء", exampleWord: "بيت" },
  { letter: "ت", name: "تاء", exampleWord: "تفاح" },
  { letter: "ث", name: "ثاء", exampleWord: "ثعلب" },
];

describe("buildLetterMatchRound", () => {
  it("builds exactly two tiles (a letter tile and a name tile) per chosen letter", () => {
    const round = buildLetterMatchRound(letters, 2, () => 0);
    expect(round.pairCount).toBe(2);
    expect(round.tiles).toHaveLength(4);
    expect(round.tiles.filter((tile) => tile.type === "letter")).toHaveLength(2);
    expect(round.tiles.filter((tile) => tile.type === "name")).toHaveLength(2);
  });

  it("caps pairCount at the number of available letters", () => {
    const round = buildLetterMatchRound(letters, 10, () => 0);
    expect(round.pairCount).toBe(letters.length);
    expect(round.tiles).toHaveLength(letters.length * 2);
  });

  it("gives every tile a letterKey that matches its source letter", () => {
    const round = buildLetterMatchRound(letters, 1, () => 0);
    const [first] = letters;
    expect(round.tiles.every((tile) => tile.letterKey === first?.letter)).toBe(true);
  });
});

describe("isMatchingPair", () => {
  const letterTile = { id: "letter-0", type: "letter" as const, value: "ا", letterKey: "ا" };
  const nameTile = { id: "name-0", type: "name" as const, value: "ألف", letterKey: "ا" };
  const otherNameTile = { id: "name-1", type: "name" as const, value: "باء", letterKey: "ب" };

  it("matches a letter tile with its own name tile", () => {
    expect(isMatchingPair(letterTile, nameTile)).toBe(true);
  });

  it("does not match tiles from different letters", () => {
    expect(isMatchingPair(letterTile, otherNameTile)).toBe(false);
  });

  it("does not match two tiles of the same type, even with the same letter key", () => {
    const secondLetterTile = { id: "letter-0b", type: "letter" as const, value: "ا", letterKey: "ا" };
    expect(isMatchingPair(letterTile, secondLetterTile)).toBe(false);
  });

  it("does not match a tile with itself", () => {
    expect(isMatchingPair(letterTile, letterTile)).toBe(false);
  });
});
