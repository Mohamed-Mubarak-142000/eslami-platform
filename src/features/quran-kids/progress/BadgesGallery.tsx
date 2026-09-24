"use client";

import { BADGE_DEFINITIONS } from "./badges";
import { useKidsProgress } from "./KidsProgressProvider";

export function BadgesGallery() {
  const { state } = useKidsProgress();
  const unlockedBadgeIds = state.unlockedBadgeIds;

  return (
    <div className="quran-kids-badge-grid" aria-label="الشارات">
      {BADGE_DEFINITIONS.map((badge) => {
        const unlocked = unlockedBadgeIds.includes(badge.id);
        const Icon = badge.icon;
        return (
          <div key={badge.id} className="quran-kids-badge" data-unlocked={unlocked}>
            <span className="quran-kids-badge__icon" aria-hidden><Icon /></span>
            <span className="quran-kids-badge__label">{badge.label}</span>
            <span className="quran-kids-badge__description">{badge.description}</span>
          </div>
        );
      })}
    </div>
  );
}
