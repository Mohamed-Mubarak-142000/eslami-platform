"use client";

import Link from "next/link";
import type { Route } from "next";
import { useState } from "react";
import { motion } from "framer-motion";
import { BookOpenCheck, Gem, RefreshCw } from "lucide-react";
import { cn } from "@/lib/cn";
import { toArabicDigits } from "@/lib/arabic";
import { useKidsProgress } from "../progress/KidsProgressProvider";
import { BADGE_DEFINITIONS } from "../progress/badges";
import { chestGems, gemBalance, ownedItemIds, unopenedChests } from "../progress/rewards";
import { Companion } from "../companion/Companion";
import { useCompanion } from "../companion/CompanionProvider";
import { Celebration } from "../ui/Celebration";
import { kidsButton, kidsPanel } from "../ui/kidsStyles";
import { sfx } from "../sfx";
import { getRewardItem, REWARD_ITEMS, type RewardItem } from "./catalog";

export type RewardsTab = "chests" | "badges" | "shop";

const TABS: { id: RewardsTab; label: string; emoji: string }[] = [
  { id: "chests", label: "صناديقي", emoji: "🎁" },
  { id: "badges", label: "شاراتي", emoji: "🏅" },
  { id: "shop", label: "المتجر", emoji: "🛍️" },
];

function ChestsTab() {
  const { state, openChest } = useKidsProgress();
  const { react } = useCompanion();
  const [opening, setOpening] = useState<string | null>(null);
  const [revealed, setRevealed] = useState<string | null>(null);
  const chests = unopenedChests(state);

  function open(chestId: string) {
    if (opening) return;
    sfx.tap();
    setOpening(chestId);
    // Let the chest shake for a moment before it bursts open.
    setTimeout(() => {
      const reward = openChest(chestId);
      setOpening(null);
      if (!reward) return;
      sfx.win();
      react("chest");
      setRevealed(reward);
    }, 1100);
  }

  const item = revealed ? getRewardItem(revealed) : undefined;
  const gems = revealed ? chestGems(revealed) : 0;

  return (
    <div>
      {chests.length === 0 ? (
        <div className={`${kidsPanel} text-center`}>
          <p className="text-6xl" aria-hidden>
            📦
          </p>
          <p className="mt-3 text-xl font-extrabold text-emerald-deep">لا توجد صناديق الآن</p>
          <p className="mt-1 text-lg text-muted">أكمل محطة في الرحلة أو تحدي اليوم لتحصل على صندوق مفاجآت!</p>
        </div>
      ) : (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {chests.map((chest, index) => (
            <motion.li key={chest.id} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.06 }}>
              <button
                type="button"
                onClick={() => open(chest.id)}
                disabled={opening !== null}
                className="flex w-full flex-col items-center rounded-[2rem] bg-white/95 p-5 shadow-lift ring-4 ring-white/60 transition-transform hover:-translate-y-1"
              >
                <motion.span
                  className="text-7xl"
                  aria-hidden
                  animate={
                    opening === chest.id ? { rotate: [0, -12, 12, -12, 12, 0], scale: [1, 1.1, 1.1, 1.2, 1.3, 1.4] } : { y: [0, -6, 0] }
                  }
                  transition={opening === chest.id ? { duration: 1.1 } : { duration: 2, repeat: Infinity, delay: index * 0.2 }}
                >
                  🎁
                </motion.span>
                <span className="mt-3 text-lg font-extrabold text-emerald-deep">{chest.label}</span>
                <span className={kidsButton("rose", "mt-3 px-5 py-2 text-base")}>افتحه!</span>
              </button>
            </motion.li>
          ))}
        </ul>
      )}
      <Celebration
        open={revealed !== null}
        title={item ? "مفاجأة!" : "جواهر!"}
        message={item ? `حصلت على: ${item.name}` : `حصلت على ${toArabicDigits(gems)} جوهرة`}
      >
        <span className="w-full text-7xl" aria-hidden>
          {item ? item.emoji : "💎"}
        </span>
        <button type="button" onClick={() => setRevealed(null)} className={kidsButton("emerald")}>
          رائع!
        </button>
        {item && (
          <Link href={"/kids/rewards?tab=shop" as Route} onClick={() => setRevealed(null)} className={kidsButton("white")}>
            {item.kind === "companion" ? "ألبسه لرفيقي" : "شاهده في المتجر"}
          </Link>
        )}
      </Celebration>
    </div>
  );
}

function BadgesTab() {
  const { state } = useKidsProgress();
  const unlocked = new Set(state.unlockedBadgeIds);
  return (
    <div>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {BADGE_DEFINITIONS.map((badge) => {
          const Icon = badge.icon;
          const has = unlocked.has(badge.id);
          return (
            <li
              key={badge.id}
              className={cn(
                "rounded-[2rem] p-4 text-center shadow-lift ring-4",
                has ? "bg-white ring-[#f5d77a]" : "bg-white/70 ring-white/50",
              )}
            >
              <span
                className={cn(
                  "mx-auto grid size-16 place-items-center rounded-full",
                  has ? "bg-[#f5b92e] text-white shadow-[0_5px_0_#c98f10]" : "bg-[#e5e9e4] text-[#a9b3ae]",
                )}
              >
                <Icon className="size-8" aria-hidden />
              </span>
              <span className="mt-2 block text-base font-extrabold text-emerald-deep">{badge.label}</span>
              <span className="mt-0.5 block text-sm text-muted">{badge.description}</span>
            </li>
          );
        })}
      </ul>
      <div className="mt-6 text-center">
        <Link href="/kids/progress" className={kidsButton("white")}>
          <BookOpenCheck aria-hidden /> ما حفظته من السور
        </Link>
      </div>
    </div>
  );
}

function ShopItem({ item }: { item: RewardItem }) {
  const { state, buyItem, toggleEquip } = useKidsProgress();
  const { react } = useCompanion();
  const owned = ownedItemIds(state).has(item.id);
  const worn = state.companion?.equipped.includes(item.id) ?? false;
  const balance = gemBalance(state);
  const short = item.price - balance;

  function buy() {
    if (buyItem(item.id)) {
      sfx.win();
      react("correct");
      if (item.kind === "companion") toggleEquip(item.id);
    }
  }

  return (
    <li
      className={cn(
        "flex flex-col items-center rounded-[2rem] p-4 text-center shadow-lift ring-4",
        worn ? "bg-[#fff6d8] ring-[#f5d77a]" : "bg-white/95 ring-white/60",
      )}
    >
      <span className="text-5xl" aria-hidden>
        {item.emoji}
      </span>
      <span className="mt-2 text-base font-extrabold text-emerald-deep">{item.name}</span>
      {owned ? (
        item.kind === "companion" ? (
          <button
            type="button"
            onClick={() => {
              sfx.tap();
              toggleEquip(item.id);
            }}
            className={kidsButton(worn ? "white" : "emerald", "mt-3 px-4 py-2 text-base")}
          >
            {worn ? "انزعه" : "ألبسه"}
          </button>
        ) : (
          <span className="mt-3 rounded-full bg-[#d9f5e3] px-4 py-2 text-base font-extrabold text-[#0b7a44]">في حديقتك 🌳</span>
        )
      ) : (
        <>
          <button type="button" onClick={buy} disabled={short > 0} className={kidsButton("sky", "mt-3 px-4 py-2 text-base")}>
            <Gem aria-hidden /> {toArabicDigits(item.price)}
          </button>
          {short > 0 && <span className="mt-1.5 text-xs font-bold text-muted">تحتاج {toArabicDigits(short)} جوهرة أخرى</span>}
        </>
      )}
    </li>
  );
}

function ShopTab() {
  const { state } = useKidsProgress();
  const companionItems = REWARD_ITEMS.filter((item) => item.kind === "companion");
  const gardenItems = REWARD_ITEMS.filter((item) => item.kind === "garden");
  return (
    <div className="space-y-6">
      <div className={`${kidsPanel} flex flex-col items-center gap-4 sm:flex-row`}>
        {state.companion && (
          <Companion animal={state.companion.animal} equipped={state.companion.equipped} mood="happy" className="h-44 w-40 shrink-0" />
        )}
        <div className="text-center sm:text-start">
          <p className="text-lg text-muted">عندك</p>
          <p className="text-4xl font-extrabold text-[#155f8c]">
            💎 {toArabicDigits(gemBalance(state))} <span className="text-2xl">جوهرة</span>
          </p>
          <p className="mt-2 text-base text-muted">تجمع الجواهر من المحطات وتحدي اليوم والشارات والصناديق.</p>
          <Link href="/kids/welcome" className={kidsButton("white", "mt-3 px-4 py-2 text-base")}>
            <RefreshCw aria-hidden /> غيّر رفيقك
          </Link>
        </div>
      </div>
      <section>
        <h2 className="mb-3 text-2xl font-extrabold text-white drop-shadow">لرفيقك 🐾</h2>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {companionItems.map((item) => (
            <ShopItem key={item.id} item={item} />
          ))}
        </ul>
      </section>
      <section>
        <h2 className="mb-3 text-2xl font-extrabold text-white drop-shadow">لحديقتك 🌳</h2>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {gardenItems.map((item) => (
            <ShopItem key={item.id} item={item} />
          ))}
        </ul>
      </section>
    </div>
  );
}

export function RewardsView({ initialTab }: { initialTab: RewardsTab }) {
  const [tab, setTab] = useState<RewardsTab>(initialTab);
  const { state } = useKidsProgress();
  const chests = unopenedChests(state).length;
  return (
    <div className="mx-auto max-w-4xl">
      <div className={`${kidsPanel} text-center`}>
        <h1 className="text-3xl font-extrabold text-emerald-deep sm:text-4xl">🏆 جوائزي</h1>
        <div className="mt-5 flex justify-center gap-2" role="tablist" aria-label="أقسام الجوائز">
          {TABS.map((entry) => (
            <button
              key={entry.id}
              type="button"
              role="tab"
              aria-selected={tab === entry.id}
              onClick={() => {
                sfx.tap();
                setTab(entry.id);
              }}
              className={cn(
                "relative rounded-full px-4 py-2.5 text-lg font-extrabold sm:px-6",
                tab === entry.id ? "bg-[#7a5af5] text-white shadow-[0_5px_0_#5a3ed1]" : "bg-white text-muted ring-2 ring-[#e2e8df]",
              )}
            >
              {entry.emoji} {entry.label}
              {entry.id === "chests" && chests > 0 && (
                <span className="absolute -top-2 -inset-e-1 grid min-w-6 place-items-center rounded-full bg-[#e84a67] px-1.5 text-xs text-white ring-2 ring-white">
                  {toArabicDigits(chests)}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-6" role="tabpanel">
        {tab === "chests" && <ChestsTab />}
        {tab === "badges" && <BadgesTab />}
        {tab === "shop" && <ShopTab />}
      </div>
    </div>
  );
}
