"use client";

import { AnimatePresence, motion } from "framer-motion";
import { BadgeCheck, BookOpen, Bookmark, Clapperboard, ImageIcon, Info, MapPin, MessageCircle, MoreHorizontal, Plus, Share2, Smile, ThumbsUp, UserRoundPlus, Video, X } from "lucide-react";
import { useState, type FormEvent } from "react";
import type { KnowledgeContent, ScholarProfile } from "@/domain";
import { useTranslations } from "@/i18n/LocaleProvider";
import { Alert, Button, Textarea } from "@/components/ui";
import { ScholarIdentity, SourceCitation } from "@/components/patterns";
import { useSocialMotionPreset } from "@/lib/motion";
import { FeatureState, type FeatureStatus } from "../shared/FeatureState";
import "../shared/social-pages.css";
import "./content-features.css";

function MiniIdentity({ name, role, verified = true }: { name: string; role: string; verified?: boolean }) {
  const t = useTranslations("feed");
  return (
    <div className="feed-identity">
      <span className="feed-avatar" aria-hidden="true">{name.slice(0, 1)}</span>
      <span>
        <strong>
          {name} {verified && <BadgeCheck className="feed-verified" size={15} aria-label={t.verifiedIdentity} />}
        </strong>
        <small>{role}</small>
      </span>
    </div>
  );
}

function StoryStrip() {
  const t = useTranslations("feed");
  const [status, setStatus] = useState("");
  const stories = t.highlights.slice(1);

  return (
    <section className="feed-stories" aria-labelledby="feed-stories-title">
      <h2 id="feed-stories-title" className="feed-sr-only">{t.highlightsAria}</h2>
      <div className="feed-stories__track" role="list">
        <button
          className="feed-story feed-story--create"
          type="button"
          role="listitem"
          onClick={() => setStatus(t.composerNote)}
          aria-label={`${t.publish}: ${t.homeTitle}`}
        >
          <span className="feed-story__portrait" aria-hidden="true">م</span>
          <span className="feed-story__create-icon" aria-hidden="true"><Plus size={20} strokeWidth={3} /></span>
          <strong>{t.publish}</strong>
        </button>
        {stories.map((story, index) => (
          <button className="feed-story" type="button" role="listitem" key={story.id} data-story={index + 1} aria-label={`${story.label}: ${story.meta}`}>
            <span className="feed-story__ring" aria-hidden="true">{story.label.slice(0, 1)}</span>
            <span className="feed-story__visual" aria-hidden="true" />
            <strong>{story.label}</strong>
          </button>
        ))}
      </div>
      {status && <p className="feed-sr-only" role="status">{status}</p>}
    </section>
  );
}

export function FeedComposer({ onSubmit }: { onSubmit?: (text: string) => void | Promise<void> }) {
  const t = useTranslations("feed");
  const [text, setText] = useState("");
  const [composerOpen, setComposerOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = text.trim();
    if (value.length < 8) return setMessage(t.composerValidation);
    setMessage("");
    setBusy(true);
    try {
      await onSubmit?.(value);
      setText("");
      setComposerOpen(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="feed-composer" aria-label={t.composerAria}>
      <form onSubmit={submit}>
        <div className="feed-composer__row">
          <span className="feed-avatar" aria-hidden="true">م</span>
          <button className="feed-composer__prompt" type="button" onClick={() => setComposerOpen(true)}>
            بم تفكر يا Mohamed؟
          </button>
        </div>
        <div className="feed-composer__quick-actions" aria-label={t.composerAria}>
          <button type="button" aria-label="إنشاء مقطع"><Clapperboard size={21} aria-hidden="true" /><span>{t.kindPost}</span></button>
          <button type="button" aria-label="إضافة صورة"><ImageIcon size={21} aria-hidden="true" /><span>{t.addSource}</span></button>
          <button type="button" aria-label="فيديو مباشر"><Video size={21} aria-hidden="true" /><span>{t.chooseTopic}</span></button>
        </div>
        {composerOpen && (
          <div className="feed-composer__dialog-layer" onKeyDown={(event) => { if (event.key === "Escape") setComposerOpen(false); }}>
            <button className="feed-composer__dialog-backdrop" type="button" aria-label="إغلاق نافذة إنشاء منشور" onClick={() => setComposerOpen(false)} />
            <section className="feed-composer__dialog" role="dialog" aria-modal="true" aria-labelledby="composer-dialog-title">
              <header>
                <h2 id="composer-dialog-title">إنشاء منشور</h2>
                <button type="button" aria-label="إغلاق" onClick={() => setComposerOpen(false)}><X aria-hidden="true" /></button>
              </header>
              <div className="feed-composer__dialog-identity">
                <span className="feed-avatar" aria-hidden="true">م</span>
                <span><strong>Mohamed Mubarak</strong><small>العامة · مساهمة معرفية</small></span>
              </div>
              <label className="feed-sr-only" htmlFor="feed-composer-input">{t.composerSrLabel}</label>
              <Textarea
                id="feed-composer-input"
                value={text}
                autoFocus
                onChange={(event) => setText(event.currentTarget.value)}
                placeholder="بم تفكر يا Mohamed؟"
                aria-invalid={Boolean(message)}
                aria-describedby={message ? "composer-error" : "composer-note"}
              />
              {message && <p id="composer-error" role="alert" className="feed-error">{message}</p>}
              <p id="composer-note" className="feed-composer__dialog-note"><Info size={14} aria-hidden="true" /> {t.composerNote}</p>
              <div className="feed-composer__dialog-additions" aria-label="إضافة إلى منشورك">
                <strong>إضافة إلى منشورك</strong>
                <button type="button" aria-label="إضافة صورة"><ImageIcon aria-hidden="true" /></button>
                <button type="button" aria-label="الإشارة إلى أشخاص"><UserRoundPlus aria-hidden="true" /></button>
                <button type="button" aria-label="إضافة شعور"><Smile aria-hidden="true" /></button>
                <button type="button" aria-label="إضافة موقع"><MapPin aria-hidden="true" /></button>
              </div>
              <Button type="submit" loading={busy} disabled={!text.trim()}>{t.publish}</Button>
            </section>
          </div>
        )}
      </form>
    </section>
  );
}

export function ContentCard({ content, saved = false, onSave, onHelpful, onComment, onShare }: { content: KnowledgeContent; saved?: boolean; onSave?: (id: string) => void; onHelpful?: (id: string, value: boolean) => void; onComment?: (id: string, text: string) => void; onShare?: (id: string) => void }) {
  const t = useTranslations("feed");
  const [isSaved, setIsSaved] = useState(saved);
  const [helpful, setHelpful] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [comment, setComment] = useState("");
  const [status, setStatus] = useState("");
  const preset = useSocialMotionPreset("toggle");
  const kind = content.kind === "article" ? t.kindArticle : content.kind === "answer" ? t.kindAnswer : t.kindPost;

  function toggleHelpful() {
    const value = !helpful;
    setHelpful(value);
    setStatus(value ? t.helpfulOn : t.helpfulOff);
    onHelpful?.(content.id, value);
  }
  function toggleSave() {
    const value = !isSaved;
    setIsSaved(value);
    setStatus(value ? t.saveOn : t.saveOff);
    onSave?.(content.id);
  }
  function submitComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = comment.trim();
    if (!value) return;
    onComment?.(content.id, value);
    setComment("");
    setStatus(t.commentSubmitted);
  }

  return (
    <article className="feed-post" aria-labelledby={`${content.id}-title`}>
      <header className="feed-post__header">
        <MiniIdentity name={t.defaultAuthorName} role={t.defaultAuthorRole} />
        <button className="feed-more" type="button" aria-label={t.moreOptionsAria}><MoreHorizontal size={18} /></button>
      </header>
      <div className="feed-post__trust">
        <span>{kind}</span>
        <span aria-hidden="true">•</span>
        <time dateTime={content.publishedAt}>{t.publishedToday}</time>
        <span aria-hidden="true">•</span>
        <span>{t.editoriallyReviewed}</span>
      </div>
      <div className="feed-post__body">
        <h2 id={`${content.id}-title`}>{content.title}</h2>
        <p>{content.summary}</p>
        <button type="button" className="feed-post__continue">{t.continueReading}</button>
      </div>
      <figure className="feed-post__media" aria-label={content.title}>
        <span aria-hidden="true" />
        <figcaption>{kind}</figcaption>
      </figure>
      {content.sources.length > 0 && (
        <aside className="feed-source" aria-label={t.sourceAria}>
          <BookOpen size={18} aria-hidden="true" />
          <span>
            <strong>{t.source}</strong>
            <small>{content.sources[0]?.title}{content.sources[0]?.locator ? ` — ${content.sources[0].locator}` : ""}</small>
          </span>
          <span className="feed-source__badge">{t.sourceBadge}</span>
        </aside>
      )}
      <div className="feed-post__stats">
        <span>{t.helpfulCount(helpful)}</span>
        <button type="button" onClick={() => setCommentsOpen(true)}>{t.commentsCount}</button>
      </div>
      <footer className="feed-actions" aria-label={t.contentActionsAria}>
        <motion.button {...preset} type="button" aria-pressed={helpful} onClick={toggleHelpful}>
          <ThumbsUp size={17} fill={helpful ? "currentColor" : "none"} aria-hidden="true" /> {t.helpful}
        </motion.button>
        <button type="button" aria-expanded={commentsOpen} onClick={() => setCommentsOpen((value) => !value)}>
          <MessageCircle size={17} aria-hidden="true" /> {t.comment}
        </button>
        <motion.button {...preset} type="button" aria-pressed={isSaved} onClick={toggleSave}>
          <Bookmark size={17} fill={isSaved ? "currentColor" : "none"} aria-hidden="true" /> {isSaved ? t.saved : t.save}
        </motion.button>
        <button type="button" onClick={() => onShare?.(content.id)}>
          <Share2 size={17} aria-hidden="true" /> {t.share}
        </button>
      </footer>
      {status && <p className="feed-live" role="status">{status}</p>}
      <AnimatePresence initial={false}>
        {commentsOpen && (
          <motion.section
            className="feed-comments"
            aria-label={t.commentsAria}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18, ease: [0.2, 0, 0, 1] }}
          >
            <div className="feed-comment">
              <span className="feed-avatar" aria-hidden="true">س</span>
              <p><strong>{t.seedCommentAuthor}</strong><span>{t.seedCommentText}</span></p>
            </div>
            <form onSubmit={submitComment}>
              <label className="feed-sr-only" htmlFor={`${content.id}-comment`}>{t.commentSrLabel}</label>
              <input id={`${content.id}-comment`} value={comment} onChange={(event) => setComment(event.currentTarget.value)} placeholder={t.commentPlaceholder} />
              <Button type="submit" variant="ghost" disabled={!comment.trim()}>{t.commentSubmit}</Button>
            </form>
            <small>{t.commentsNote}</small>
          </motion.section>
        )}
      </AnimatePresence>
    </article>
  );
}

export function Feed({ items, status = "ready", onRetry }: { items: readonly KnowledgeContent[]; status?: FeatureStatus; onRetry?: () => void }) {
  const t = useTranslations("feed");
  const actual = status === "ready" && items.length === 0 ? "empty" : status;

  return (
    <FeatureState status={actual} {...(onRetry ? { onRetry } : {})}>
      <div className="social-feed">
        <h1 className="feed-sr-only">{t.homeTitle}</h1>
        <FeedComposer />
        <StoryStrip />
        <motion.section
          className="feed-list"
          aria-labelledby="feed-title"
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.06 } } }}
        >
          <h2 id="feed-title" className="feed-sr-only">{t.feedListSrHeading}</h2>
          {items.map((item) => (
            <motion.div key={item.id} variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }} transition={{ duration: 0.22, ease: [0.2, 0, 0, 1] }}>
              <ContentCard content={item} />
            </motion.div>
          ))}
        </motion.section>
      </div>
    </FeatureState>
  );
}

export function ContentDetail({ content, author }: { content: KnowledgeContent; author: ScholarProfile }) {
  const t = useTranslations("feed");
  return (
    <article className="content-detail" aria-labelledby="content-title">
      <p>{content.kind}</p>
      <h1 id="content-title">{content.title}</h1>
      <ScholarIdentity name={author.displayName} specialty="باحث متخصص" initials={author.displayName.slice(0, 2)} status={author.verificationStatus === "approved" ? "approved" : "unverified"} />
      <p>{content.body}</p>
      <section aria-labelledby="sources-title">
        <h2 id="sources-title">{t.sourcesHeading}</h2>
        {content.sources.map((source, index) => (
          <SourceCitation
            key={source.id}
            index={index + 1}
            type={source.type}
            title={source.title}
            {...(source.authorOrOrganization ? { authorOrOrg: source.authorOrOrganization } : {})}
            {...(source.locator ? { locator: source.locator } : {})}
            {...(source.url ? { url: source.url } : {})}
          />
        ))}
      </section>
    </article>
  );
}

export function SavedCollections({ items, unavailable = false }: { items: readonly KnowledgeContent[]; unavailable?: boolean }) {
  const t = useTranslations("feed");
  return (
    <section className="saved-collections social-page" aria-labelledby="saved-title">
      <header className="social-page__hero"><span><Bookmark aria-hidden="true" /></span><div><p>محتواك للرجوع إليه لاحقًا</p><h1 id="saved-title">{t.savedTitle}</h1></div></header>
      {unavailable && <Alert tone="warning">{t.savedUnavailable}</Alert>}
      {items.length ? items.map((item) => <ContentCard key={item.id} content={item} saved />) : <p>{t.savedEmpty}</p>}
    </section>
  );
}
