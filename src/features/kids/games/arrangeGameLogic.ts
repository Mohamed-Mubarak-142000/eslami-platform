const ARABIC_LETTER = /[ء-يٱ-ۓ]/;

export interface WordTile {
  id: string;
  text: string;
  /** Correct position in the ayah. */
  order: number;
}

/**
 * Splits an ayah into word tiles. Tokens with no letters (waqf/pause marks such as ۚ ۖ ۗ)
 * stay attached to the preceding word so the displayed Quran text is never altered.
 */
export function splitAyahWords(text: string): string[] {
  const words: string[] = [];
  for (const token of text.split(/\s+/).filter(Boolean)) {
    if (!ARABIC_LETTER.test(token) && words.length > 0) words[words.length - 1] = `${words[words.length - 1]} ${token}`;
    else words.push(token);
  }
  return words;
}

export function buildWordTiles(text: string, rng: () => number = Math.random): WordTile[] {
  const tiles = splitAyahWords(text).map((word, order) => ({ id: `w${order}`, text: word, order }));
  const shuffled = [...tiles];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j]!, shuffled[i]!];
  }
  // Never hand the child an already-solved puzzle.
  if (shuffled.every((tile, index) => tile.order === index) && shuffled.length > 1) shuffled.reverse();
  return shuffled;
}

export function isPlayableAyah(text: string): boolean {
  const count = splitAyahWords(text).length;
  return count >= 3 && count <= 9;
}

export function wrongPositions(placed: WordTile[]): Set<string> {
  return new Set(placed.filter((tile, index) => tile.order !== index).map((tile) => tile.id));
}
