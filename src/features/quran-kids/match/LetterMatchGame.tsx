"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, PartyPopper } from "lucide-react";
import { useKidsProgress } from "../progress/KidsProgressProvider";
import { ARABIC_LETTERS } from "./arabicLetters";
import { buildLetterMatchRound, isMatchingPair, type LetterMatchRound } from "./letterGameLogic";
import "../quran-kids.css";

const PAIR_COUNT = 6;
const WRONG_FLASH_MS = 700;

export function LetterMatchGame() {
  const { recordMatchGameCompletion } = useKidsProgress();
  const [round, setRound] = useState<LetterMatchRound>(() => buildLetterMatchRound(ARABIC_LETTERS, PAIR_COUNT));
  const [selectedTileId, setSelectedTileId] = useState<string | null>(null);
  const [matchedTileIds, setMatchedTileIds] = useState<string[]>([]);
  const [wrongTileIds, setWrongTileIds] = useState<[string, string] | null>(null);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    if (!wrongTileIds) return;
    const timer = window.setTimeout(() => {
      setWrongTileIds(null);
      setSelectedTileId(null);
    }, WRONG_FLASH_MS);
    return () => window.clearTimeout(timer);
  }, [wrongTileIds]);

  function handleTileClick(tileId: string) {
    if (matchedTileIds.includes(tileId) || wrongTileIds) return;

    if (!selectedTileId) {
      setSelectedTileId(tileId);
      return;
    }

    if (selectedTileId === tileId) {
      setSelectedTileId(null);
      return;
    }

    const first = round.tiles.find((tile) => tile.id === selectedTileId);
    const second = round.tiles.find((tile) => tile.id === tileId);
    if (!first || !second) return;

    if (isMatchingPair(first, second)) {
      const nextMatched = [...matchedTileIds, first.id, second.id];
      setMatchedTileIds(nextMatched);
      setSelectedTileId(null);
      if (nextMatched.length === round.tiles.length) {
        setCompleted(true);
        recordMatchGameCompletion("letters");
      }
    } else {
      setWrongTileIds([first.id, second.id]);
    }
  }

  function handleReplay() {
    setRound(buildLetterMatchRound(ARABIC_LETTERS, PAIR_COUNT));
    setSelectedTileId(null);
    setMatchedTileIds([]);
    setWrongTileIds(null);
    setCompleted(false);
  }

  return (
    <main id="quran-main" className="quran-page">
      <Link href="/quran/kids/match" className="quran-back"><ArrowRight aria-hidden /> رجوع</Link>

      <section className="quran-reciter-header">
        <div>
          <span className="landing-kicker">لعبة مطابقة الحروف</span>
          <h1>طابق كل حرف باسمه</h1>
        </div>
      </section>

      {!completed && (
        <div className="quran-kids-letter-grid">
          {round.tiles.map((tile) => {
            const isMatched = matchedTileIds.includes(tile.id);
            const isSelected = selectedTileId === tile.id || wrongTileIds?.includes(tile.id);
            return (
              <button
                key={tile.id}
                type="button"
                className="quran-kids-letter-tile"
                data-matched={isMatched}
                data-selected={isSelected && !isMatched}
                onClick={() => handleTileClick(tile.id)}
                disabled={isMatched}
              >
                {tile.value}
              </button>
            );
          })}
        </div>
      )}

      {completed && (
        <div className="quran-kids-score-panel">
          <PartyPopper size={40} color="#f5c518" aria-hidden />
          <p>أحسنت! طابقت كل الحروف بنجاح 🎉</p>
          <button type="button" className="quran-kids-choice" onClick={handleReplay}>جولة جديدة</button>
        </div>
      )}
    </main>
  );
}
