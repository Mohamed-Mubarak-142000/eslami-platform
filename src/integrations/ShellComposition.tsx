import Link from "next/link";
import type { ScholarProfile, Topic } from "@/domain";

export function ShellSearch() {
  return (
    <form className="shell-search" action="/search" method="get">
      <label className="ds-visually-hidden" htmlFor="shell-search-query">
        ابحث في المحتوى الموثق
      </label>
      <input
        id="shell-search-query"
        name="q"
        type="search"
        inputMode="search"
        autoComplete="off"
        placeholder="ابحث في المحتوى والعلماء والموضوعات"
      />
      <button type="submit">بحث</button>
    </form>
  );
}

export function ShellActions() {
  return (
    <div className="shell-actions" aria-label="إجراءات الحساب">
      <Link href="/settings/privacy" aria-label="الإعدادات">
        الإعدادات
      </Link>
      <Link href="/me/questions" aria-label="الملف الشخصي وأسئلتي">
        حسابي
      </Link>
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
  return (
    <div className="discovery-rail">
      <header>
        <p>مكتبة منير</p>
        <h2>اكتشف المزيد</h2>
      </header>

      <section aria-labelledby="discovery-topics-title">
        <h3 id="discovery-topics-title">موضوعات مقترحة</h3>
        <ul>
          {topics.map((topic) => (
            <li key={topic.id}>
              <Link href={`/topics/${topic.slug}`}>{topic.name}</Link>
            </li>
          ))}
        </ul>
        <Link className="discovery-rail__more" href="/explore">
          تصفح كل الموضوعات
        </Link>
      </section>

      <section aria-labelledby="discovery-scholars-title">
        <h3 id="discovery-scholars-title">علماء وباحثون</h3>
        <ul>
          {scholars.map((scholar) => (
            <li key={scholar.id}>
              <Link href={`/scholars/${scholar.slug}`}>
                <span aria-hidden="true">{scholar.displayName.slice(0, 2)}</span>
                <span>
                  <strong>{scholar.displayName}</strong>
                  <small>ملف موثق تجريبي</small>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
