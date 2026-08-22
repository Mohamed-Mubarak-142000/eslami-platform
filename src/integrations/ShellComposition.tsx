"use client";

import Link from "next/link";
import Image from "next/image";
import { Bookmark, BookOpen, Clapperboard, Compass, Home, ImageIcon, Landmark, Library, MessageCircleQuestion, Search, Sparkles, UserRound, UsersRound, Video, type LucideIcon } from "lucide-react";
import type { ScholarProfile, Topic } from "@/domain";
import type { NavigationItem } from "@/components/layout";
import { useTranslations } from "@/i18n/LocaleProvider";
import shamelaLibraryBanner from "./assets/shamela-library-banner.png";

export function ShortcutsRail({ navigation, topics }: { navigation: readonly NavigationItem[]; topics: readonly Topic[] }) {
  const t = useTranslations("shell");
  const navigationIcons: Record<string, LucideIcon> = {
    "/": Home,
    "/explore": Compass,
    "/search": Search,
    "/ask": MessageCircleQuestion,
    "/me/questions": Bookmark,
  };
  const topicIcons = [BookOpen, Library, Landmark, Sparkles] as const;
  return (
    <div className="shortcuts-rail">
      <Link className="shortcuts-rail__profile" href="/me/questions">
        <span aria-hidden="true"><UserRound size={20} /></span>
        <strong>{t.account}</strong>
      </Link>
      <nav aria-label={t.primaryNavigation}>
        {navigation.map((item) => {
          const NavigationIcon = navigationIcons[item.href] ?? Sparkles;
          return (
            <a key={item.href} href={item.href} aria-current={item.active ? "page" : undefined}>
              <span aria-hidden="true"><NavigationIcon size={20} /></span>
              {item.label}
            </a>
          );
        })}
      </nav>
      <section aria-labelledby="shortcuts-topics-title">
        <h2 id="shortcuts-topics-title">{t.suggestedTopics}</h2>
        {topics.slice(0, 4).map((topic, index) => {
          const TopicIcon = topicIcons[index] ?? BookOpen;
          return (
            <Link key={topic.id} href={`/topics/${topic.slug}`}>
              <span className={`shortcuts-rail__tile shortcuts-rail__tile--${index + 1}`} aria-hidden="true"><TopicIcon size={19} /></span>
              {topic.name}
            </Link>
          );
        })}
      </section>
    </div>
  );
}

export function ShellSearch() {
  const t = useTranslations("shell");
  return (
    <form className="shell-search" action="/search" method="get">
      <label className="ds-visually-hidden" htmlFor="shell-search-query">
        {t.searchLabel}
      </label>
      <input
        id="shell-search-query"
        name="q"
        type="search"
        inputMode="search"
        autoComplete="off"
        placeholder={t.searchPlaceholder}
      />
      <button type="submit">{t.searchSubmit}</button>
    </form>
  );
}

export function ShellActions() {
  const t = useTranslations("shell");
  return (
    <div className="shell-actions" aria-label={t.accountActions}>
      <Link href="/settings/privacy" aria-label={t.settings}>
        {t.settings}
      </Link>
      <Link href="/me/questions" aria-label={t.account}>
        {t.account}
      </Link>
    </div>
  );
}

export function SocialMediaActions() {
  const t = useTranslations("shell");
  return (
    <div className="social-media-actions" aria-label={t.accountActions}>
      <a className="social-media-actions__reel" href="#feed-composer-input" aria-label="إنشاء مقطع"><Clapperboard size={22} aria-hidden="true" /></a>
      <a className="social-media-actions__photo" href="#feed-composer-input" aria-label="إضافة صورة"><ImageIcon size={22} aria-hidden="true" /></a>
      <a className="social-media-actions__video" href="#feed-composer-input" aria-label="فيديو مباشر"><Video size={22} aria-hidden="true" /></a>
    </div>
  );
}

export function DiscoveryRail({
  topics,
  scholars,
}: {
  topics: readonly Topic[];
  scholars: readonly ScholarProfile[];
}) {
  const t = useTranslations("shell");
  const notableProfiles = [
    { id: "ahmed-zewail", name: "أحمد زويل", field: "عالم كيمياء" },
    { id: "farouk-el-baz", name: "فاروق الباز", field: "عالم فضاء وجيولوجيا" },
    { id: "magdi-yacoub", name: "مجدي يعقوب", field: "جرّاح قلب" },
  ] as const;
  return (
    <div className="discovery-rail">
      <a
        className="discovery-rail__library-banner"
        href="https://shamela.ws/"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="زيارة الموقع الرسمي للمكتبة الشاملة"
      >
        <Image
          src={shamelaLibraryBanner}
          alt="مكتبة إسلامية تضم مخطوطًا مفتوحًا ورفوفًا من الكتب"
          sizes="(min-width: 1024px) 255px, 0px"
        />
        <span>المكتبة الشاملة</span>
      </a>

      <section className="discovery-rail__topics" aria-labelledby="discovery-topics-title">
        <h3 id="discovery-topics-title">{t.suggestedTopics}</h3>
        <ul>
          {topics.map((topic) => (
            <li key={topic.id}>
              <Link href={`/topics/${topic.slug}`}>{topic.name}</Link>
            </li>
          ))}
        </ul>
        <Link className="discovery-rail__more" href="/explore">
          {t.browseAllTopics}
        </Link>
      </section>

      <section className="discovery-rail__suggestions" aria-labelledby="discovery-suggestions-title">
        <h3 id="discovery-suggestions-title">اقتراحات للمتابعة</h3>
        <ul>
          {notableProfiles.map((profile) => (
            <li key={profile.id}>
              <span className="discovery-rail__suggestion-avatar" aria-hidden="true"><UsersRound size={19} /></span>
              <span className="discovery-rail__suggestion-copy">
                <strong>{profile.name}</strong>
                <small>{profile.field}</small>
              </span>
              <button type="button" aria-label={`متابعة ${profile.name}`}>متابعة</button>
            </li>
          ))}
        </ul>
      </section>

      <section className="discovery-rail__scholars" aria-labelledby="discovery-scholars-title">
        <h3 id="discovery-scholars-title">{t.scholarsAndResearchers}</h3>
        <ul>
          {scholars.map((scholar) => (
            <li key={scholar.id}>
              <Link href={`/scholars/${scholar.slug}`}>
                <span className="discovery-rail__contact-avatar" aria-hidden="true">
                  {scholar.displayName.slice(0, 2)}
                  <i />
                </span>
                <span>
                  <strong>{scholar.displayName}</strong>
                  <small>{t.trialVerifiedProfile}</small>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
