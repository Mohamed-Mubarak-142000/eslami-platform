"use client";

import { AnimatePresence, motion } from "framer-motion";
import { BadgeCheck, BookOpen, Bookmark, ImageIcon, Info, MessageCircle, MoreHorizontal, Plus, Share2, Smile, ThumbsUp, Video } from "lucide-react";
import { useState, type FormEvent } from "react";
import type { KnowledgeContent, ScholarProfile } from "@/domain";
import { useTranslations } from "@/i18n/LocaleProvider";
import { Alert, Button, Textarea } from "@/components/ui";
import { ScholarIdentity, SourceCitation } from "@/components/patterns";
import { useSocialMotionPreset } from "@/lib/motion";
import { FeatureState, type FeatureStatus } from "../shared/FeatureState";
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
  const [expanded, setExpanded] = useState(false);
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
      setExpanded(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="feed-composer" aria-label={t.composerAria}>
      <form onSubmit={submit}>
        <div className="feed-composer__row">
          <span className="feed-avatar" aria-hidden="true">م</span>
          <label className="feed-sr-only" htmlFor="feed-composer-input">{t.composerSrLabel}</label>
          <Textarea
            id="feed-composer-input"
            value={text}
            onFocus={() => setExpanded(true)}
            onChange={(event) => setText(event.currentTarget.value)}
            placeholder={t.composerPlaceholder}
            aria-invalid={Boolean(message)}
            aria-describedby={message ? "composer-error" : undefined}
          />
        </div>
        <div className="feed-composer__quick-actions" aria-label={t.composerAria}>
          <button type="button"><Video size={19} aria-hidden="true" /> {t.kindPost}</button>
          <button type="button"><ImageIcon size={19} aria-hidden="true" /> {t.addSource}</button>
          <button type="button"><Smile size={19} aria-hidden="true" /> {t.chooseTopic}</button>
        </div>
        {message && <p id="composer-error" role="alert" className="feed-error">{message}</p>}
        {expanded && (
          <div className="feed-composer__expanded">
            <p><Info size={14} aria-hidden="true" /> {t.composerNote}</p>
            <div>
              <button type="button">{t.addSource}</button>
              <button type="button">{t.chooseTopic}</button>
              <Button type="submit" loading={busy}>{t.publish}</Button>
            </div>
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
  const [tab, setTab] = useState<"for-you" | "following" | "latest">("for-you");
  const actual = status === "ready" && items.length === 0 ? "empty" : status;

  return (
    <FeatureState status={actual} {...(onRetry ? { onRetry } : {})}>
      <div className="social-feed">
        <h1 className="feed-sr-only">{t.homeTitle}</h1>
        <FeedComposer />
        <StoryStrip />
        <nav className="feed-tabs" aria-label={t.tabsAria}>
          <button type="button" aria-current={tab === "for-you" ? "page" : undefined} onClick={() => setTab("for-you")}>{t.tabForYou}</button>
          <button type="button" aria-current={tab === "following" ? "page" : undefined} onClick={() => setTab("following")}>{t.tabFollowing}</button>
          <button type="button" aria-current={tab === "latest" ? "page" : undefined} onClick={() => setTab("latest")}>{t.tabLatest}</button>
        </nav>
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
    <section className="saved-collections" aria-labelledby="saved-title">
      <h1 id="saved-title">{t.savedTitle}</h1>
      {unavailable && <Alert tone="warning">{t.savedUnavailable}</Alert>}
      {items.length ? items.map((item) => <ContentCard key={item.id} content={item} saved />) : <p>{t.savedEmpty}</p>}
    </section>
  );
}
